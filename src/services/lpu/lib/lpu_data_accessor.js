'use strict'

/**
 * @typedef {import("mongodb").Db} mongodb.Db
 * @typedef {import("mongodb").Collection<Collection.Lpu>} LpuCollection
 * @typedef {import("mongodb").FindCursor<Collection.Lpu>} LpuFindCursor
 */

const { CollectionNameEnum } = require('../../../globals')
const { hashLpuName } = require('./lpu_helper_functions')
const {
  generateId,
  isDuplicateMongoError
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
        { _id: id },
        active ? { $unset: { xtime: 1 } } : { $set: { xtime: new Date() } }
      )
      .then(res => res.matchedCount === 1)
  }

  /**
   * @param {Collection.OmitBase<Collection.Lpu, "_hash">} doc New document to insert in the database.
   * @param {{ attempts?: number, length: number, prefix: number }} options Document creation options.
   * @returns {Promise<Collection.InferIdType<Collection.Lpu>>} Document's primary key.
   */
  async create(doc, options) {
    const { attempts = DEFAULT_INSERT_ATTEMPTS, length, prefix } = options

    try {
      const { insertedId } = await this.collection.insertOne({
        _id: generateId({ length, prefix }),
        _hash: hashLpuName(doc.abbr),
        ctime: new Date(),
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

  /**
   * @param {Collection.Lpu["_hash"]} hash Value of unique index.
   * @returns {Promise<Collection.Lpu?>} Matched document or `null`.
   */
  findByHash(hash) {
    return this.collection.findOne({ _hash: hash })
  }

  /**
   * @returns {LpuFindCursor} Cursor over existing (non-deleted) documents in the collection.
   */
  list() {
    return this.collection.find({})
  }

  /**
   * @param {Collection.InferIdType<Collection.Lpu>} id Document's primary key.
   * @returns {Promise<Collection.Lpu?>} Matched document or `null`.
   */
  read(id) {
    return this.collection.findOne({ _id: id })
  }

  /**
   * @param {Collection.InferIdType<Collection.Lpu>} id Document's primary key.
   * @param {Collection.OmitBase<Collection.Lpu, "_hash">} doc Replacement data.
   * @returns {Promise<boolean>} `true` if matching document is found, `false` otherwise.
   */
  replace(id, doc) {
    return this.collection
      .updateOne({ _id: id }, [
        {
          $replaceWith: {
            $mergeObjects: [
              doc,
              {
                _id: '$_id',
                _hash: hashLpuName(doc.abbr),
                ctime: '$ctime',
                xtime: '$xtime'
              }
            ]
          }
        },
        { $set: { mtime: '$$NOW' } }
      ])
      .then(res => res.matchedCount === 1)
  }
}

/**
 * @param {mongodb.Db} db Instance of database.
 * @returns {LpuDataAccessor} Collection data provider.
 */
module.exports = db => new LpuDataAccessor(db, CollectionNameEnum.LPU)
/** @type {typeof isDuplicateMongoError} */
module.exports.isDuplicateError = (error, ...keys) =>
  isDuplicateMongoError(error, ...keys)
