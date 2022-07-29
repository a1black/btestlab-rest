'use strict'

const mongodb = require('mongodb')

const { CollectionNameEnum } = require('../../../globals')
const { dateUnsetTime } = require('./contingent_helper_functions')

class ContingentDbProvider {
  /**
   * @param {mongodb.Db} db Database instance.
   * @param {string} name Collection name.
   */
  constructor(db, name) {
    /** @type {mongodb.Collection<Collection.Contingent>} Instance of employee collection. */
    this.collection = db.collection(name)
  }

  /**
   * @param {Collection.OmitBase<Collection.Contingent>} doc New document to insert in the database.
   * @returns {Promise<Collection.Contingent['code']>}
   */
  create(doc) {
    return this.collection
      .insertOne({ ctime: dateUnsetTime(), ...doc })
      .then(() => doc.code)
  }

  /**
   * Returns cursor over deleted documents of specified `code`.
   * @param {Collection.Contingent['code']} code Unique contingent code.
   * @returns {mongodb.FindCursor<Partial<Collection.Contingent>>}
   */
  history(code) {
    return this.collection
      .find({ code, dtime: { $exists: true } })
      .sort('dtime', 1)
      .project({ _id: 0, ctime: 1, dtime: 1 })
  }

  /**
   * Returns cursor over active documents in the collection.
   * @returns {mongodb.FindCursor<Collection.OmitBase<Collection.Contingent>>}
   */
  list() {
    return this.collection
      .find({ dtime: { $exists: false } })
      .sort({ dtime: 1, code: 1 })
      .project({ _id: 0, code: 1, desc: 1 })
  }

  /**
   * @param {Collection.Contingent['code']} code Unique contingent code.
   * @returns {Promise<Collection.Contingent?>}
   */
  read(code) {
    return this.collection.findOne({ code, dtime: { $exists: false } })
  }

  /**
   * @param {Collection.Contingent['code']} code Unique contingent code.
   * @returns {Promise<boolean>}
   */
  async remove(code) {
    const query = { code, dtime: { $exists: false } }
    try {
      const updResult = await this.collection.updateOne(query, {
        $set: { dtime: dateUnsetTime() }
      })
      return updResult.matchedCount === 1
    } catch (error) {
      if (error instanceof mongodb.MongoError && error.code === 11000) {
        const delResult = await this.collection.deleteOne(query)
        return delResult.deletedCount === 1
      } else {
        throw error
      }
    }
  }

  /**
   * @param {Collection.Contingent['code']} code Unique contingent code.
   * @param {Collection.OmitBase<Collection.Contingent, 'code'>} data Fields to update in the matching document.
   * @returns {Promise<boolean>}
   */
  update(code, data) {
    return this.collection
      .updateOne(
        { code, dtime: { $exists: false } },
        { $set: data, $currentDate: { mtime: true } }
      )
      .then(res => res.matchedCount === 1)
  }
}

/** @type {(db: mongodb.Db) => ContingentDbProvider} */
module.exports = db =>
  new ContingentDbProvider(db, CollectionNameEnum.CONTINGENT)
