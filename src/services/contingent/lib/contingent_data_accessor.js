'use strict'

/**
 * @typedef {import("mongodb").Db} mongodb.Db
 * @typedef {import("mongodb").Collection<Collection.Contingent>} ContingentCollection
 * @typedef {import("mongodb").Filter<Collection.Contingent>} ContingentFilter
 * @typedef {import("mongodb").FindCursor<Partial<Collection.Contingent>>} ContingentFindCursor
 * @typedef {import("mongodb").InferIdType<Collection.Contingent>} ContingentIdType
 */

const { CollectionNameEnum } = require('../../../globals')
const { isDuplicateMongoError } = require('../../../libs/mongodb_helpers')

class ContingentDataAccessor {
  /**
   * @param {mongodb.Db} db Database instance.
   * @param {string} name Collection name.
   */
  constructor(db, name) {
    /** @type {ContingentCollection} Collection instance. */
    this.collection = db.collection(name)
  }

  /**
   * @param {Collection.OmitBase<Collection.Contingent> & { code: ContingentIdType }} doc New document to insert in the database.
   * @returns {Promise<ContingentIdType>} Primary key.
   */
  create(doc) {
    const { code, ...insertDoc } = doc

    return this.collection
      .insertOne({ _id: code, ...insertDoc, ctime: new Date() })
      .then(res => res.insertedId)
  }

  /**
   * @returns {ContingentFindCursor} Cursor over documents in the collection.
   */
  list() {
    return this.collection.find({}).project({ desc: 1 })
  }

  /**
   * @param {ContingentIdType} id Contingent code.
   * @returns {Promise<Collection.Contingent?>} Matched contingent document or `null`.
   */
  read(id) {
    return this.collection.findOne({ _id: id })
  }

  /**
   * @param {ContingentIdType} id Contingent code.
   * @returns {Promise<boolean>} `true` if matching document was deleted, `false` otherwise.
   */
  remove(id) {
    return this.collection
      .deleteOne({ _id: id })
      .then(res => res.deletedCount === 1)
  }

  /**
   * @param {Omit<Collection.Contingent, "ctime">} doc Modified version of contingent document.
   * @returns {Promise<boolean>} `true` if matching document was modified, `false` otherwise.
   */
  update(doc) {
    const { _id, desc } = doc

    return this.collection
      .updateOne(
        { _id },
        {
          ...(desc ? { $set: { desc } } : { $unset: { desc: 1 } }),
          $currentDate: { mtime: true }
        }
      )
      .then(res => res.modifiedCount === 1)
  }
}

/**
 * @param {mongodb.Db} db Instance of database.
 * @returns {ContingentDataAccessor} Collection data provider.
 */
module.exports = db =>
  new ContingentDataAccessor(db, CollectionNameEnum.CONTINGENT)
/** @type {typeof isDuplicateMongoError} */
module.exports.isDuplicateError = (error, ...keys) =>
  isDuplicateMongoError(error, ...keys)
