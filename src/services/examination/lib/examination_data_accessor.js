'use strict'

/**
 * @typedef {Collection.Examination<Dict<any>>} ExaminationDocument
 * @typedef {ExaminationDocument["uid"] & { type: ExaminationDocument["type"] }} ExaminationDocumentUid
 *
 * @typedef {import("mongodb").Db} mongodb.Db
 * @typedef {import("mongodb").Collection<ExaminationDocument>} ExaminationCollection
 * @typedef {import("mongodb").Filter<ExaminationDocument>} ExaminationFilter
 * @typedef {import("mongodb").FindCursor<Partial<ExaminationDocument>>} ExaminationFindCursor
 *
 * @typedef {{ user?: Partial<User> }} UpdateOptions
 */

const { CollectionNameEnum } = require('../../../globals')
const { objectSetShallow } = require('../../../libs/functional_helpers')
const {
  isDuplicateMongoError,
  queryDeleted,
  queryExisted
} = require('../../../libs/mongodb_helpers')

/**
 * @param {Partial<User>} [user] Application user that initiated operation.
 * @returns {{ firstname?: string, lastname?: string } | undefined} Fullname document.
 */
function author(user) {
  const author = {}
  objectSetShallow(author, 'firstname', user?.firstname)
  objectSetShallow(author, 'lastname', user?.lastname)

  return Object.keys(author).length ? author : undefined
}

/**
 * Updates query to match documents with provided `uid`.
 *
 * @param {ExaminationFilter} filter Document selection criteria.
 * @param {Partial<ExaminationDocumentUid>} uid Document's unique identifier.
 * @returns {ExaminationFilter} Modified criteria object.
 */
function queryByUID(filter, uid) {
  const query = { ...filter }

  objectSetShallow(query, 'uid.date', uid.date)
  objectSetShallow(query, 'uid.number', uid.number)
  objectSetShallow(query, 'type', uid.type)

  return query
}

/**
 * Returns criteria to sort documents using unique index of `uid` field.
 *
 * @param {boolean} [asc=true] If `false` sort document in descending order.
 * @returns {import("mongodb").Sort} Document sorting criteria.
 */
function sortByUID(asc = true) {
  const direction = asc === false ? -1 : 1

  return {
    type: direction,
    'uid.date': direction,
    'uid.number': direction
  }
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
   * @param {Collection.OmitBase<ExaminationDocument, "cuser" | "muser">} doc New document to insert in the database.
   * @param {UpdateOptions} options Insert options.
   * @returns {Promise<Collection.Examination["uid"]?>} Unique identifier of inserted document.
   */
  create(doc, options) {
    const { uid, type, ...data } = doc
    const insertDoc = { uid, type, ...data, ctime: '$$NOW' }
    const updateDoc = { mtime: '$$NOW' }

    objectSetShallow(insertDoc, 'cuser', author(options.user))
    objectSetShallow(updateDoc, 'muser', author(options.user))

    return this.collection
      .updateOne(
        queryDeleted(queryByUID({}, { type, ...uid })),
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
      .then(res =>
        res.modifiedCount === 1 || res.upsertedCount === 1 ? uid : null
      )
  }

  /**
   * Updates document to be marked as deleted.
   *
   * @param {ExaminationDocumentUid} uid Document's unique identifier.
   * @param {UpdateOptions} options Delete options.
   * @returns {Promise<boolean>} `true` if matching document is modified, `false` otherwise.
   */
  remove(uid, options) {
    /** @type {{ muser?: ExaminationDocument["muser"] }} */
    const updateDoc = {}
    objectSetShallow(updateDoc, 'muser', author(options.user))

    return this.collection
      .updateOne(queryExisted(queryByUID({}, uid)), {
        $set: updateDoc,
        $currentDate: { dtime: true, mtime: true }
      })
      .then(res => res.modifiedCount === 1)
  }

  /**
   * Returns cursor over matched, non-deleted documents in the collection.

   * @param {ExaminationFilter & { date: ExaminationDocument["uid"]["date"] }} [filter] Document selection criteria.
   * @returns {ExaminationFindCursor} Cursor over matched documents.
   */
  list(filter) {
    const { date, ...query } = filter ?? {}

    return this.collection
      .find(queryExisted(queryByUID(query, { date })))
      .sort(sortByUID(false))
      .project({
        _id: 0,
        uid: 1,
        type: 1,
        contingent: 1,
        lpu: 1,
        location: 1,
        examined: 1,
        result: 1
      })
  }

  /**
   * @param {ExaminationDocumentUid} uid Document's unique identifier.
   * @returns {Promise<ExaminationDocument?>} Matched document or `null`.
   */
  read(uid) {
    return this.collection.findOne(queryExisted(queryByUID({}, uid)))
  }

  /**
   * Replaces document that is not marked as deleted.
   *
   * @param {Collection.OmitBase<ExaminationDocument, "cuser" | "muser">} doc Replacement data.
   * @param {UpdateOptions} options Update options.
   * @returns {Promise<boolean>} `true` if matching document is modified, `false` otherwise.
   */
  replace(doc, options) {
    const { uid, type, ...data } = doc
    const replaceDoc = { uid, type, ...data }
    const updateDoc = { mtime: '$$NOW' }

    objectSetShallow(updateDoc, 'muser', author(options.user))

    return this.collection
      .updateOne(
        queryExisted(queryByUID({}, { type, ...uid })),
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
