'use strict'

const mongodb = require('mongodb')

const { CollectionNameEnum } = require('../../../globals')
const { dateUnsetTime, generateId } = require('./lpu_helper_functions')

const DEFAULT_INSERT_ATTEMPTS = 3

/**
 * Extends query with condition to include only deleted documents.
 * @param {mongodb.Filter<Collection.Lpu>} query Find filter object.
 * @returns {mongodb.Filter<Collection.Lpu>}
 */
const deletedCond = query => ({
  dtime: { $exists: true, $type: 'date' },
  ...query
})
/**
 * Extends query with condition to filter out deleted documents.
 * @param {mongodb.Filter<Collection.Lpu>} query Find filter object.
 * @returns {mongodb.Filter<Collection.Lpu>}
 */
const existedCond = query => ({ dtime: { $exists: false }, ...query })

class LpuDbProvider {
  /**
   * @param {mongodb.Db} db Database instance.
   * @param {string} name Collection name.
   */
  constructor(db, name) {
    /** @type {mongodb.Collection<Collection.Lpu>} Collection instance. */
    this.collection = db.collection(name)
  }

  /**
   * Flags document as active or inactive.
   * @param {mongodb.InferIdType<Collection.Lpu>} id Document primary key.
   * @param {boolean} active New document state.
   * @returns {Promise<boolean>} `true` if document was found, `false` otherwise.
   */
  activate(id, active) {
    return this.collection
      .updateOne(
        existedCond({ _id: id }),
        active ? { $unset: { xtime: 1 } } : { $set: { xtime: dateUnsetTime() } }
      )
      .then(res => res.matchedCount === 1)
  }

  /**
   * @param {Collection.OmitBase<Collection.Lpu>} doc New document to insert in the database.
   * @param {{ attempts?: number, idLength: number, idPrefix: number }} options Document creation options.
   * @returns {Promise<mongodb.InferIdType<Collection.Lpu>>} Document primary key.
   */
  async create(doc, options) {
    const { attempts = DEFAULT_INSERT_ATTEMPTS, idLength, idPrefix } = options

    try {
      const { insertedId } = await this.collection.insertOne({
        _id: generateId({ length: idLength, prefix: idPrefix }),
        ctime: dateUnsetTime(),
        ...doc
      })

      return insertedId
    } catch (error) {
      if (
        error instanceof mongodb.MongoError &&
        error.code === 11000 &&
        // @ts-ignore
        error.keyPattern?._id
      ) {
        if (attempts > 0) {
          return this.create(
            doc,
            Object.assign({}, options, { attempts: attempts - 1 })
          )
        } else {
          throw new Error(
            `Exceeded maximum attempts to generate unique document '_id' for '${this.collection.collectionName}' collection`
          )
        }
      } else {
        throw error
      }
    }
  }

  /**
   * @returns {mongodb.FindCursor<Collection.Lpu>} Cursor over existing documents in the collection.
   */
  list() {
    return this.collection.find(existedCond({}))
  }

  /**
   * @param {mongodb.InferIdType<Collection.Lpu>} id Document primary key.
   * @returns {Promise<Collection.Lpu?>} Document if one was found.
   */
  read(id) {
    return this.collection.findOne(existedCond({ _id: id }))
  }

  /**
   * @param {mongodb.InferIdType<Collection.Lpu>|Pick<Collection.Lpu, 'code'|'dep'>} key Unique key for searching document.
   * @returns {Promise<Collection.Lpu?>} Document if one was found, `null` otherwise.
   */
  readDeleted(key) {
    return this.collection.findOne(
      deletedCond(
        typeof key === 'number'
          ? { _id: key }
          : { code: key.code, dep: key.dep ?? { $exists: false } }
      )
    )
  }

  /**
   * @param {mongodb.InferIdType<Collection.Lpu>} id Primary key value.
   * @returns {Promise<boolean>} `true` if document was found, `false` otherwise.
   */
  remove(id) {
    return this.collection
      .updateOne({ _id: id }, { $set: { dtime: dateUnsetTime() } })
      .then(res => res.matchedCount === 1)
  }

  /**
   * @param {mongodb.InferIdType<Collection.Lpu>} id Document primary key.
   * @param {Collection.OmitBase<Collection.Lpu>} doc Replacement data.
   * @returns {Promise<boolean>} `true` if document was found, `false` otherwise.
   */
  replace(id, doc) {
    return this.collection
      .updateOne(existedCond({ _id: id }), [
        {
          $replaceWith: {
            $mergeObjects: [
              { _id: '$_id', ctime: '$ctiem', xtime: '$xtime' },
              doc
            ]
          }
        },
        { $set: { mtime: '$$NOW' } }
      ])
      .then(res => res.matchedCount === 1)
  }

  /**
   * Removes 'deleted' status from a document.
   * @param {mongodb.InferIdType<Collection.Lpu>} id Document primary key.
   * @returns {Promise<boolean>} `true` if document was found, `false` otherwise.
   */
  restore(id) {
    return this.collection
      .updateOne(deletedCond({ _id: id }), {
        $unset: { dtime: 1 }
      })
      .then(res => res.matchedCount === 1)
  }
}

/** @type {(db: mongodb.Db) => LpuDbProvider} */
module.exports = db => new LpuDbProvider(db, CollectionNameEnum.LPU)
