'use strict'

const mongodb = require('mongodb')

const initConfiguration = require('../../src/configs')

/** @type {() => Promise<[mongodb.MongoClient, mongodb.Db]>} Returns database connection. */
async function connect() {
  const { db } = await initConfiguration()
  const client = await mongodb.MongoClient.connect(db.uri)

  return [client, client.db(db.dbname)]
}

/** @type {(name: string) => Promise<void>} Removes all documents from specified collection. */
async function clearCollection(name) {
  const [client, db] = await connect()
  try {
    await db.collection(name).deleteMany({})
  } catch (error) {
    // Ignore missing collection error
  }

  await client.close(true)
}

/** @type {(name: string) => Promise<void>} Removes specified collection. */
async function dropCollection(name) {
  const [client, db] = await connect()

  try {
    await db.dropCollection(name)
  } catch (error) {
    // Ignore missing collection error
  }

  await client.close(true)
}

module.exports = { connect, clearCollection, dropCollection }
