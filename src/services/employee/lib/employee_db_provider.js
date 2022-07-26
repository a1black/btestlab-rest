'use strict'

const mongodb = require('mongodb')

const { CollectionNameEnum } = require('../../../globals')
const { generateId } = require('./employee_helper_functions')

const DEFAULT_INSERT_ATTEMPTS = 3

class EmployeeDbProvider {
  /**
   * @param {mongodb.Db} db Database instance.
   * @param {string} name Collection name.
   */
  constructor(db, name) {
    /** @type {mongodb.Collection<Collection.Employee>} Instance of employee collection. */
    this.collection = db.collection(name)
  }

  /**
   * @param {Collection.OmitBase<Collection.Employee>} doc New employee data.
   * @param {{ attempts?: number, codeLength: number, codePrefix: number }} options Document creation options.
   * @return {Promise<mongodb.InferIdType<Collection.Employee>>} Employee ID.
   */
  async create(doc, options) {
    const {
      attempts = DEFAULT_INSERT_ATTEMPTS,
      codeLength,
      codePrefix
    } = options

    try {
      const { insertedId } = await this.collection.insertOne({
        _id: generateId({ length: codeLength, prefix: codePrefix }),
        ctime: new Date(),
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
            `Exceeded maximum attempts to generate unique document '_id' for '${CollectionNameEnum.EMPLOYEE}' collection`
          )
        }
      } else {
        throw error
      }
    }
  }

  /**
   * @returns {mongodb.FindCursor<Collection.Employee>} Cursor over employee collection.
   */
  list() {
    return this.collection.find()
  }

  /**
   * @param {mongodb.InferIdType<Collection.Employee>} id Primary key value.
   * @returns {Promise<Collection.Employee?>}
   */
  read(id) {
    return this.collection.findOne({ _id: id })
  }

  /**
   * @param {mongodb.InferIdType<Collection.Employee>} id Primary key value.
   * @returns {Promise<boolean>}
   */
  remove(id) {
    return this.collection
      .deleteOne({ _id: id })
      .then(res => res.deletedCount === 1)
  }

  /**
   * @param {mongodb.InferIdType<Collection.Employee>} id Primary key value.
   * @param {Collection.OmitBase<Collection.Employee>} doc Replacement document.
   * @returns {Promise<boolean>}
   */
  replace(id, doc) {
    return this.collection
      .updateOne({ _id: id }, [
        {
          $replaceWith: {
            $mergeObjects: [
              { _id: '$_id', ctime: '$ctiem' },
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
   * @param {mongodb.InferIdType<Collection.Employee>} id Primary key value.
   * @param {Collection.OmitBase<Collection.Employee>} doc Document fields to update.
   * @returns {Promise<boolean>}
   */
  update(id, doc) {
    return this.collection
      .updateOne({ _id: id }, { $set: doc, $currentDate: { mtime: true } })
      .then(res => res.matchedCount === 1)
  }
}

/** @type {(db: mongodb.Db) => EmployeeDbProvider} */
module.exports = db => new EmployeeDbProvider(db, CollectionNameEnum.EMPLOYEE)
