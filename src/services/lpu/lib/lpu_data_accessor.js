'use strict'

/**
 * @typedef {import("mongodb").Db} mongodb.Db
 * @typedef {import("mongodb").Collection<Collection.Lpu>} LpuCollection
 * @typedef {import("mongodb").Filter<Collection.Lpu>} LpuFilter
 * @typedef {import("mongodb").FindCursor<Collection.Lpu>} LpuFindCursor
 * @typedef {import("mongodb").InferIdType<Collection.Lpu>} LpuIdType
 */

const crypto = require('crypto')

const commonQueries = require('../../../libs/mongo/queries')
const mongoutils = require('../../../libs/mongo/utils')
const { CollectionNameEnum } = require('../../../globals')

class LpuDataAccessor {
  /**
   * @param {mongodb.Db} db Database instance.
   * @param {string} name Collection name.
   */
  constructor(db, name) {
    /** @type {LpuCollection} Collection instance. */
    this.collection = db.collection(name)

    const createCallback = this.create.bind(this)
    this.create = mongoutils.generateIdDecorator(
      createCallback,
      crypto.randomUUID
    )
  }

  /**
   * Changes state of the document.
   *
   * @param {Collection.Lpu["uid"]} uid Document's unique identifier.
   * @param {boolean} active New state value.
   * @returns {Promise<boolean>} `true` if matching document was found, `false` otherwise.
   */
  activate(uid, active) {
    const queryByUID = commonQueries.subdocQuery({ uid })
    const queryExisted = commonQueries.deletedDocQuery(false)

    // NOTE: Method returns `true` even if document already in required state.
    return this.collection
      .updateOne(
        queryByUID(queryExisted()),
        active ? { $unset: { xtime: 1 } } : { $currentDate: { xtime: true } }
      )
      .then(res => res.matchedCount === 1)
  }

  /**
   * Inserts new document or replaces document flaged as deleted.
   *
   * @param {Collection.Lpu} doc New document added to the collection.
   * @returns {Promise<LpuIdType>} Primary key.
   */
  create(doc) {
    const { _id, uid, ...data } = doc
    // NOTE: Lpu created inactive to hold-off its apperence in selection lists.
    const insertDoc = { _id, uid, ...data, ctime: '$$NOW', xtime: '$$NOW' }

    const queryByUID = commonQueries.subdocQuery({ uid })
    const queryDeleted = commonQueries.deletedDocQuery(true)

    return this.collection
      .updateOne(
        queryByUID(queryDeleted()),
        [
          {
            $replaceWith: {
              $mergeObjects: [
                insertDoc,
                { _id: '$_id', ctime: '$ctime' },
                { $cond: ['$_id', { mtime: '$$NOW' }, {}] }
              ]
            }
          }
        ],
        { upsert: true }
      )
      .then(() => _id)
  }

  /**
   * @returns {LpuFindCursor} Cursor over non-deleted documents in the collection.
   */
  list() {
    const queryExisted = commonQueries.deletedDocQuery(false)

    return this.collection.find(queryExisted()).sort('uid', 1)
  }

  /**
   * @param {Collection.Lpu["uid"]} uid Document's unique identifier.
   * @returns {Promise<Collection.Lpu?>} Matched document or `null`.
   */
  read(uid) {
    // NOTE: Fetching deleted document is required to access old records.
    return this.collection.findOne({ uid })
  }

  /**
   * Updates document to be marked as deleted.
   *
   * @param {Collection.Lpu["uid"]} uid Document's unique identifier.
   * @returns {Promise<boolean>} `true` if matching document was modified, `false` otherwise.
   */
  remove(uid) {
    const queryByUID = commonQueries.subdocQuery({ uid })
    const queryExisted = commonQueries.deletedDocQuery(false)

    return this.collection
      .updateOne(queryByUID(queryExisted()), {
        $currentDate: { dtime: true, mtime: true }
      })
      .then(res => res.modifiedCount === 1)
  }

  /**
   * Replaces document that is not marked as deleted.
   *
   * @param {Collection.Lpu["uid"]} uid Document's unique identifier.
   * @param {Collection.OmitBase<Collection.Lpu>} doc Replacement lpu document.
   * @returns {Promise<boolean>} `true` if matching document was modified, `false` otherwise.
   */
  replace(uid, doc) {
    const queryByUID = commonQueries.subdocQuery({ uid })
    const queryExisted = commonQueries.deletedDocQuery(false)

    return this.collection
      .updateOne(
        queryByUID(queryExisted()),
        [
          {
            $replaceWith: {
              $mergeObjects: [
                doc,
                { _id: '$_id', ctime: '$ctime', xtime: '$xtime' }
              ]
            }
          },
          { $set: { mtime: '$$NOW' } }
        ],
        { upsert: false }
      )
      .then(res => res.modifiedCount === 1)
  }
}

/**
 * @param {mongodb.Db} db Instance of database.
 * @returns {LpuDataAccessor} Lpu collection data provider.
 */
module.exports = db => new LpuDataAccessor(db, CollectionNameEnum.LPU)
/** @type {typeof mongoutils.isDuplicateMongoError} */
module.exports.isDuplicateError = (error, ...keys) =>
  mongoutils.isDuplicateMongoError(error, ...keys)
