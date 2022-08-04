'use strict'

/**
 * @typedef {import("mongodb").Db} mongodb.Db
 * @typedef {import("mongodb").Collection<Collection.Employee>} EmployeeCollection
 * @typedef {import("mongodb").FindCursor<Collection.Employee>} EmployeeFindCursor
 */

const { CollectionNameEnum } = require('../../../globals')
const {
  generateId,
  isDuplicateMongoError
} = require('../../../libs/mongodb_helpers')

const DEFAULT_INSERT_ATTEMPTS = 3

class EmployeeDataAccessor {
  /**
   * @param {mongodb.Db} db Database instance.
   * @param {string} name Collection name.
   */
  constructor(db, name) {
    /** @type {EmployeeCollection} Collection instance. */
    this.collection = db.collection(name)
  }

  /**
   * @param {Collection.OmitBase<Collection.Employee>} doc New document to insert in the database.
   * @param {{ attempts?: number, length: number, prefix: number }} options Document creation options.
   * @returns {Promise<Collection.InferIdType<Collection.Employee>>} Document's primary key.
   */
  async create(doc, options) {
    const { attempts = DEFAULT_INSERT_ATTEMPTS, length, prefix } = options

    try {
      const { insertedId } = await this.collection.insertOne({
        _id: generateId({ length, prefix }),
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
   * @returns {EmployeeFindCursor} Cursor over documents in the collection.
   */
  list() {
    // TODO: add sorting criteria and projection
    return this.collection.find()
  }

  /**
   * @param {Collection.InferIdType<Collection.Employee>} id Document's primary key.
   * @returns {Promise<Collection.Employee?>} Matched document or `null`.
   */
  read(id) {
    return this.collection.findOne({ _id: id })
  }

  /**
   * @param {Collection.InferIdType<Collection.Employee>} id Document's primary key.
   * @returns {Promise<boolean>} `true` if document was deleted, `false` otherwise.
   */
  remove(id) {
    return this.collection
      .deleteOne({ _id: id })
      .then(res => res.deletedCount === 1)
  }

  /**
   * @param {Collection.InferIdType<Collection.Employee>} id Document's primary key.
   * @param {Collection.OmitBase<Collection.Employee, "password">} doc Replacement document.
   * @returns {Promise<boolean>} `true` if matching document is found, `false` otherwise.
   */
  replace(id, doc) {
    return this.collection
      .updateOne({ _id: id }, [
        {
          $replaceWith: {
            $mergeObjects: [
              { _id: '$_id', ctime: '$ctiem' },
              // TODO: is this condition necessary
              { $cond: ['$password', { password: '$password' }, {}] },
              doc
            ]
          }
        },
        { $set: { mtime: '$$NOW' } }
      ])
      .then(res => res.matchedCount === 1)
  }

  /**
   * @param {Collection.InferIdType<Collection.Employee>} id Document's primary key.
   * @param {Collection.Employee["password"]} password New password value.
   * @returns {Promise<boolean>} `true` if matching document is found, `false` otherwise.
   */
  updatePassword(id, password) {
    return this.collection
      .updateOne(
        { _id: id },
        {
          ...(password ? { $set: { password } } : { $unset: { password: 1 } }),
          $currentDate: { mtime: true }
        }
      )
      .then(res => res.matchedCount === 1)
  }
}

/** @type {(db: mongodb.Db) => EmployeeDataAccessor} */
module.exports = db => new EmployeeDataAccessor(db, CollectionNameEnum.EMPLOYEE)
