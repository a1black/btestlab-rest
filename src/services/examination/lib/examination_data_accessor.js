'use strict'

/**
 * @typedef {Collection.Examination<Dict<any>>} ExaminationDocument
 * @typedef {Partial<Pick<Collection.Examination, "accounted" | "number">> & Pick<Collection.Examination, "type">} ExaminationIdIndex
 *
 * @typedef {import("mongodb").Db} mongodb.Db
 * @typedef {import("mongodb").Collection<ExaminationDocument>} ExaminationCollection
 * @typedef {import("mongodb").Filter<ExaminationDocument>} ExaminationFilter
 * @typedef {import("mongodb").FindCursor<Partial<ExaminationDocument>>} ExaminationFindCursor
 *
 * @typedef {{ user?: Partial<User> }} UpdateOptions
 */

const commonQueries = require('../../../libs/mongo/queries')
const objectSet = require('../../../libs/objectset')
const { CollectionNameEnum } = require('../../../globals')
const { isDuplicateMongoError } = require('../../../libs/mongo/utils')

/**
 * @param {Partial<User>} [user] Application user that initiated operation.
 * @returns {{ firstname?: string, lastname?: string } | undefined} User's fullname document.
 */
function author(user) {
  const author = {}
  objectSet(author, 'firstname', user?.firstname)
  objectSet(author, 'lastname', user?.lastname)

  return Object.keys(author).length ? author : undefined
}

class ExaminationDataAccessor {
  /**
   * @param {mongodb.Db} db Database instance.
   * @param {string} name Collection name.
   */
  constructor(db, name) {
    /**
     * Collection instance.
     *
     * @type {ExaminationCollection}
     * @readonly
     */
    this.collection = db.collection(name)
  }

  /**
   * Inserts new document or replaces existing document that is marked as deleted.
   *
   * @param {Collection.OmitBase<ExaminationDocument, "cuser" | "muser">} doc New document added to the collection.
   * @param {UpdateOptions} options Insert options.
   * @returns {Promise<boolean>} `true` if new document was added to the database, `false` otherwise.
   */
  create(doc, options) {
    const { accounted, number, type, ...data } = doc
    const id = { type, accounted, number }
    const insertDoc = { ...id, ...data, ctime: '$$NOW' }
    const updateDoc = { mtime: '$$NOW' }

    objectSet(insertDoc, 'cuser', author(options.user))
    objectSet(updateDoc, 'muser', author(options.user))

    const queryDeleted = commonQueries.deletedDocQuery(true)
    const queryByExamId = commonQueries.subdocQuery(id, ...Object.keys(id))

    return this.collection
      .updateOne(
        queryByExamId(queryDeleted()),
        [
          {
            $replaceWith: {
              $mergeObjects: [
                insertDoc,
                { _id: '$_id', ctime: '$ctime', cuser: '$cuser' },
                { $cond: ['$_id', updateDoc, {}] }
              ]
            }
          }
        ],
        { upsert: true }
      )
      .then(res => res.modifiedCount === 1 || res.upsertedCount === 1)
  }

  /**
   * Updates document to be marked as deleted.
   *
   * @param {ExaminationIdIndex} doc Unique composite index on the collection.
   * @param {UpdateOptions} options Delete options.
   * @returns {Promise<boolean>} `true` if matching document was modified, `false` otherwise.
   */
  remove(doc, options) {
    /** @type {{ muser?: ExaminationDocument["muser"] }} */
    const updateDoc = {}
    objectSet(updateDoc, 'muser', author(options.user))

    const queryExisted = commonQueries.deletedDocQuery(false)
    const queryByExamId = commonQueries.subdocQuery(doc, ...Object.keys(doc))

    return this.collection
      .updateOne(queryByExamId(queryExisted()), {
        $set: updateDoc,
        $currentDate: { dtime: true, mtime: true }
      })
      .then(res => res.modifiedCount === 1)
  }

  /**
   * Returns cursor over matched, non-deleted documents in the collection.
   *
   * @param {Partial<ExaminationDocument>} [filter] Document selection criteria.
   * @returns {ExaminationFindCursor} Cursor over matched documents.
   */
  list(filter) {
    const { accounted, type, ...query } = filter ?? {}
    const id = { accounted, type }

    const queryExisted = commonQueries.deletedDocQuery(false)
    const queryByExamId = commonQueries.subdocQuery(id, ...Object.keys(id))

    return this.collection
      .find(queryByExamId(queryExisted(query)))
      .sort({ type: 1, accounted: 1, number: 1 })
      .project({
        _id: 0,
        accounted: 1,
        contingent: 1,
        examined: 1,
        location: 1,
        lpu: 1,
        number: 1,
        result: 1,
        type: 1
      })
  }

  /**
   * @param {ExaminationIdIndex} doc Unique composite index on the collection.
   * @returns {Promise<ExaminationDocument?>} Matched document or `null`.
   */
  read(doc) {
    const queryByExamId = commonQueries.subdocQuery(doc, ...Object.keys(doc))

    // NOTE: Allow user to access documents marked as deleted.
    return this.collection.findOne(queryByExamId())
  }

  /**
   * Replaces document that is not marked as deleted.
   *
   * @param {Collection.OmitBase<ExaminationDocument, "cuser" | "muser">} doc Replacement examination document.
   * @param {UpdateOptions} options Update options.
   * @returns {Promise<boolean>} `true` if matching document was modified, `false` otherwise.
   */
  replace(doc, options) {
    const { type, accounted, number, ...data } = doc
    const id = { type, accounted, number }
    const replaceDoc = { ...id, ...data }
    const updateDoc = { mtime: '$$NOW' }

    objectSet(updateDoc, 'muser', author(options.user))

    const queryExisted = commonQueries.deletedDocQuery(false)
    const queryByExamId = commonQueries.subdocQuery(id, ...Object.keys(id))

    return this.collection
      .updateOne(
        queryByExamId(queryExisted()),
        [
          {
            $replaceWith: {
              $mergeObjects: [
                replaceDoc,
                { _id: '$_id', ctime: '$ctime', cuser: '$cuser' }
              ]
            }
          },
          { $set: updateDoc }
        ],
        { upsert: false }
      )
      .then(res => res.modifiedCount === 1)
  }
}

/**
 * @param {mongodb.Db} db Instance of database.
 * @returns {ExaminationDataAccessor} Examination collection data provider.
 */
module.exports = db =>
  new ExaminationDataAccessor(db, CollectionNameEnum.EXAMINATION)
/** @type {typeof isDuplicateMongoError} */
module.exports.isDuplicateError = (error, ...keys) =>
  isDuplicateMongoError(error, ...keys)
