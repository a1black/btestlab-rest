'use strict'

/**
 * @typedef {import("mongodb").Db} mongodb.Db
 * @typedef {import("mongodb").Collection<User>} UserCollection
 * @typedef {import("mongodb").FindCursor<Partial<User>>} UserFindCursor
 */

const { CollectionNameEnum } = require('../../../globals')

class UserDataAccessor {
  /**
   * @param {mongodb.Db} db Database instance.
   * @param {string} name Collection name.
   */
  constructor(db, name) {
    /** @type {UserCollection} Collection instance. */
    this.collection = db.collection(name)
  }

  /**
   * @returns {UserFindCursor} Cursor over documents in the collection.
   */
  list() {
    return this.collection
      .find()
      .sort({ lastname: 1, firstname: 1, middlename: 1 })
      .project({
        admin: 1,
        birthdate: 1,
        firstname: 1,
        lastname: 1,
        middlename: 1
      })
  }

  /**
   * @param {Collection.InferIdType<User>} id Document's primary key.
   * @returns {Promise<User?>} Matched document or `null`.
   */
  read(id) {
    return this.collection.findOne({ _id: id })
  }
}

/** @type {(db: mongodb.Db) => UserDataAccessor} */
module.exports = db => new UserDataAccessor(db, CollectionNameEnum.USER)
