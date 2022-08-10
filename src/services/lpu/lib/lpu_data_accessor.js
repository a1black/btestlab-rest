'use strict'

/**
 * @typedef {import("mongodb").Db} mongodb.Db
 * @typedef {import("mongodb").Collection<Collection.Lpu>} LpuCollection
 * @typedef {import("mongodb").FindCursor<Collection.Lpu>} LpuFindCursor
 */

const { CollectionNameEnum } = require('../../../globals')
const {
  dateWithoutTime,
  generateId,
  isDuplicateMongoError,
  queryExisted,
  queryDeleted
} = require('../../../libs/mongodb_helpers')

const DEFAULT_INSERT_ATTEMPTS = 3

class LpuDataAccessor {
  /**
   * @param {mongodb.Db} db Database instance.
   * @param {string} name Collection name.
   */
  constructor(db, name) {
    /** @type {LpuCollection} Collection instance. */
    this.collection = db.collection(name)
  }

  /**
   * Flags document as active or inactive.
   *
   * @param {Collection.InferIdType<Collection.Lpu>} id Document's primary key.
   * @param {boolean} active New state of matched document.
   * @returns {Promise<boolean>} `true` if matching document is found, `false` otherwise.
   */
  activate(id, active) {
    return this.collection
      .updateOne(
        queryExisted({ _id: id }),
        active
          ? { $unset: { xtime: 1 } }
          : { $set: { xtime: dateWithoutTime() } }
      )
      .then(res => res.matchedCount === 1)
  }

  /**
   * @param {Collection.OmitBase<Collection.Lpu>} doc New document to insert in the database.
   * @param {{ attempts?: number, length: number, prefix: number }} options Document creation options.
   * @returns {Promise<Collection.InferIdType<Collection.Lpu>>} Document's primary key.
   */
  async create(doc, options) {
    const { attempts = DEFAULT_INSERT_ATTEMPTS, length, prefix } = options

    try {
      const { insertedId } = await this.collection.insertOne({
        _id: generateId({ length, prefix }),
        ctime: dateWithoutTime(),
        ...doc
      })

      return insertedId
    } catch (error) {
      if (isDuplicateMongoError(error, '_id')) {
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

  /** @type {typeof isDuplicateMongoError} */
  isDuplicateError(error, ...keys) {
    return isDuplicateMongoError(error, ...keys)
  }

  /**
   * @returns {LpuFindCursor} Cursor over existing (non-deleted) documents in the collection.
   */
  list() {
    return this.collection.find(queryExisted({})).sort({ code: 1, dep: 1 })
  }

  /**
   * @param {Collection.InferIdType<Collection.Lpu>} id Document's primary key.
   * @returns {Promise<Collection.Lpu?>} Matched document or `null`.
   */
  read(id) {
    return this.collection.findOne(queryExisted({ _id: id }))
  }

  /**
   * @param {Collection.InferIdType<Collection.Lpu> | Pick<Collection.Lpu, "code" | "dep">} key Unique key for searching document.
   * @returns {Promise<Collection.Lpu?>} Matched document or `null`.
   */
  readDeleted(key) {
    return this.collection.findOne(
      queryDeleted(
        typeof key === 'number'
          ? { _id: key }
          : { code: key.code, dep: key.dep ?? { $exists: false } }
      )
    )
  }

  /**
   * @param {Collection.InferIdType<Collection.Lpu>} id Document's primary key.
   * @returns {Promise<boolean>} `true` if matching document is found, `false` otherwise.
   */
  remove(id) {
    return this.collection
      .updateOne(queryExisted({ _id: id }), {
        $set: { dtime: dateWithoutTime() }
      })
      .then(res => res.matchedCount === 1)
  }

  /**
   * @param {Collection.InferIdType<Collection.Lpu>} id Document's primary key.
   * @param {Collection.OmitBase<Collection.Lpu>} doc Replacement data.
   * @returns {Promise<boolean>} `true` if matching document is found, `false` otherwise.
   */
  replace(id, doc) {
    return this.collection
      .updateOne(queryExisted({ _id: id }), [
        {
          $replaceWith: {
            $mergeObjects: [
              doc,
              { _id: '$_id', ctime: '$ctiem', xtime: '$xtime' }
            ]
          }
        },
        { $set: { mtime: '$$NOW' } }
      ])
      .then(res => res.matchedCount === 1)
  }

  /**
   * Removes 'deleted' status from a document.
   *
   * @param {Collection.InferIdType<Collection.Lpu>} id Document's primary key.
   * @returns {Promise<boolean>} `true` if matching document is found, `false` otherwise.
   */
  restore(id) {
    return this.collection
      .updateOne(queryDeleted({ _id: id }), { $unset: { dtime: 1 } })
      .then(res => res.matchedCount === 1)
  }
}

/** @type {(db: mongodb.Db) => LpuDataAccessor} */
module.exports = db => new LpuDataAccessor(db, CollectionNameEnum.LPU)
