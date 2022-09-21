'use strict'

/**
 * @typedef {{ length: number, prefix?: number }} GeneratorOptions PK generation parameters.
 *
 * @typedef {import("mongodb").Db} mongodb.Db
 * @typedef {import("mongodb").Collection<Collection.Employee>} EmployeeCollection
 * @typedef {import("mongodb").FindCursor<Partial<Collection.Employee>>} EmployeeFindCursor
 * @typedef {import("mongodb").InferIdType<Collection.Employee>} EmployeeIdType
 */

const crypto = require('crypto')

const { CollectionNameEnum } = require('../../../globals')
const { generateIdDecorator } = require('../../../libs/mongo/utils')

/**
 * @param {GeneratorOptions} options Generator options.
 * @returns {() => EmployeeIdType} Random number generator.
 */
function pkGenerator(options) {
  const { length, prefix = 0 } = options
  const base10 = Math.pow(10, length - (prefix ? prefix.toString().length : 0))
  const initValue = prefix * base10

  return () => crypto.randomInt(base10 - 1) + initValue
}

class EmployeeDataAccessor {
  /**
   * @param {mongodb.Db} db Database instance.
   * @param {string} name Collection name.
   * @param {() => EmployeeIdType} generator Function for generating primary key.
   */
  constructor(db, name, generator) {
    /** @type {EmployeeCollection} Collection instance. */
    this.collection = db.collection(name)
    const createEmployee = this.create.bind(this)
    this.create = generateIdDecorator(createEmployee, generator)
  }

  /**
   * @param {Collection.Employee} doc New document added to the collection.
   * @returns {Promise<EmployeeIdType>} Primary key.
   */
  create(doc) {
    const { _id, lastname, firstname, middlename, ...user } = doc

    return this.collection
      .insertOne({
        _id,
        lastname,
        firstname,
        middlename,
        ...user,
        ctime: new Date()
      })
      .then(res => res.insertedId)
  }

  /**
   * @returns {EmployeeFindCursor} Cursor over documents in the collection.
   */
  list() {
    return this.collection
      .find()
      .project({
        admin: 1,
        ctime: 1,
        firstname: 1,
        lastname: 1,
        middlename: 1,
        birthdate: 1
      })
      .sort({ lastname: 1, firstname: 1, middlename: 1, birthdate: 1 })
  }

  /**
   * @param {EmployeeIdType} id Primary key.
   * @returns {Promise<Collection.Employee?>} Matched document or `null`.
   */
  read(id) {
    return this.collection.findOne({ _id: id })
  }

  /**
   * @param {EmployeeIdType} id Primary key.
   * @returns {Promise<boolean>} `true` if document was deleted, `false` otherwise.
   */
  remove(id) {
    return this.collection
      .deleteOne({ _id: id })
      .then(res => res.deletedCount === 1)
  }

  /**
   * @param {EmployeeIdType} id Primary key.
   * @param {Collection.OmitBase<Collection.Employee, "password">} doc Replacement document.
   * @returns {Promise<boolean>} `true` if document was modified, `false` otherwise.
   */
  replace(id, doc) {
    return this.collection
      .updateOne({ _id: id }, [
        {
          $replaceWith: {
            $mergeObjects: [
              doc,
              { _id: '$_id', password: '$password', ctime: '$ctime' }
            ]
          }
        },
        { $set: { mtime: '$$NOW' } }
      ])
      .then(res => res.modifiedCount === 1)
  }

  /**
   * @param {EmployeeIdType} id Primary key.
   * @param {Collection.Employee["password"]} password Password hash string.
   * @returns {Promise<boolean>} `true` if document was modified, `false` otherwise.
   */
  updatePassword(id, password) {
    /** @type {import("mongodb").UpdateFilter<Collection.Employee>} */
    const updateDoc = password
      ? { $set: { password } }
      : { $unset: { password: 1 } }
    updateDoc['$currentDate'] = { mtime: true }

    return this.collection
      .updateOne({ _id: id }, updateDoc)
      .then(res => res.modifiedCount === 1)
  }
}

/** @type {(db: mongodb.Db, options: GeneratorOptions) => EmployeeDataAccessor} */
module.exports = (db, options) =>
  new EmployeeDataAccessor(
    db,
    CollectionNameEnum.EMPLOYEE,
    pkGenerator(options)
  )
