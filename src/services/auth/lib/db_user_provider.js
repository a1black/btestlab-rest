'use strict'

/**
 * @param {string} collectionName User collection name.
 * @param {import('mongodb').Db} db Mongo database instance.
 * @returns {(key: string, value: string) => Promise<Collection.Employee | null>}
 */
function dbUserProvider(collectionName, db) {
  /** @type {(collname: string, db: import('mongodb').Db) => import('mongodb').Collection<Collection.Employee>} */
  const collection = (collname, db) => db.collection(collname)

  return (key, value) =>
    collection(collectionName, db).findOne({
      [key === 'id' ? '_id' : key]: value,
      _deleted: { $ne: true }
    })
}

module.exports = dbUserProvider
