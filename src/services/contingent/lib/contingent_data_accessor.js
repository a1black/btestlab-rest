'use strict'

/**
 * @typedef {import("mongodb").Db} mongodb.Db
 * @typedef {import("mongodb").Collection<Collection.Contingent>} ContingentCollection
 * @typedef {import("mongodb").FindCursor<Partial<Collection.Contingent>>} ContingentFindCursor
 */

const { CollectionNameEnum } = require('../../../globals')
const {
  dateWithoutTime,
  isDuplicateMongoError,
  queryExisted,
  queryDeleted
} = require('../../../libs/mongodb_helpers')

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
   * @param {Collection.OmitBase<Collection.Contingent>} doc New document to insert in the database.
   * @returns {Promise<Collection.Contingent["code"]>} `code` property of inserted document.
   */
  create(doc) {
    return this.collection
      .insertOne({ ...doc, ctime: dateWithoutTime() })
      .then(() => doc.code)
  }

  /**
   * @param {Collection.Contingent["code"]} code Document's unique key value.
   * @returns {ContingentFindCursor} Cursor over deleted documents with specified `code` value.
   */
  history(code) {
    return this.collection
      .find(queryDeleted({ code }))
      .sort('dtime', 1)
      .project({ _id: 0, desc: 1, ctime: 1, dtime: 1 })
  }

  /**
   * @returns {ContingentFindCursor} Cursor over existing (non-deleted) documents in the collection.
   */
  list() {
    return this.collection
      .find(queryExisted({}))
      .sort({ dtime: 1, code: 1 })
      .project({ _id: 0, code: 1, desc: 1 })
  }

  /**
   * @param {Collection.Contingent["code"]} code Document's unique key value.
   * @returns {Promise<Collection.Contingent?>} Matched document or `null`.
   */
  read(code) {
    return this.collection.findOne(queryExisted({ code }))
  }

  /**
   * @param {Collection.Contingent["code"]} code Document's unique key value.
   * @returns {Promise<boolean>} `true` if matching document is found, `false` otherwise.
   */
  remove(code) {
    return (
      this.collection
        .updateOne(queryExisted({ code }), {
          $set: { dtime: dateWithoutTime() }
        })
        .catch(error => {
          if (isDuplicateMongoError(error)) {
            return this.collection.deleteOne(queryExisted({ code }))
          } else {
            throw error
          }
        })
        // @ts-ignore
        .then(res => res.matchedCount === 1 || res.deletedCount === 1)
    )
  }

  /**
   * @param {Collection.Contingent["code"]} code Document's unique key value.
   * @param {Collection.Contingent["desc"]} desc Update value for description field.
   * @returns {Promise<boolean>} `true` if matching document is found, `false` otherwise.
   */
  update(code, desc) {
    return this.collection
      .updateOne(queryExisted({ code }), {
        $currentDate: { mtime: true },
        ...(desc ? { $set: { desc } } : { $unset: { desc: 1 } })
      })
      .then(res => res.matchedCount === 1)
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
