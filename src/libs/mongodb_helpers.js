'use strict'

/** @typedef {{ keyPattern?: Dict<any>, keyValue?: Dict<any> }} DuplicateError */

const crypto = require('crypto')
const mongodb = require('mongodb')

/**
 * @param {Date} [date] A date object or current time if not provided.
 * @returns {Date} `Date` object with time set to '00:00:00.000'.
 */
function dateWithoutTime(date) {
  const timestamp =
    date instanceof Date
      ? date.getTime()
      : date === undefined
      ? Date.now()
      : null
  if (timestamp === null) {
    throw new TypeError("'date' must be instance of Date")
  }

  return new Date(timestamp - (timestamp % 86400000))
}

/**
 * @param {{ length: number, prefix?: number }} options Generation options.
 * @returns {number} Randomly generated number.
 */
function generateId(options) {
  const { length, prefix = 0 } = options
  const base = Math.pow(10, length)

  return crypto.randomInt(base - 1) + prefix * base
}

/**
 * @param {any} error Error instance to verify.
 * @param {...string} keys Fields of duplicating unique index.
 * @returns {error is mongodb.MongoError & DuplicateError}
 */
function isDuplicateMongoError(error, ...keys) {
  if (error instanceof mongodb.MongoError && error.code === 11000) {
    // @ts-ignore
    const index = Object.keys(error.keyPattern ?? {})

    return keys.every(key => index.includes(key))
  }

  return false
}

/**
 * @param {Error} error Error instance to verify.
 * @returns {error is mongodb.MongoError}
 */
function isValidationMongoError(error) {
  return error instanceof mongodb.MongoError && error.code === 121
}

/**
 * Copies source filter object and add condition to include only deleted documents.
 *
 * @template T
 * @param {mongodb.Filter<T>} query Filter object.
 * @returns {mongodb.Filter<T>} Extended copy of the source object.
 */
function queryDeleted(query) {
  return { dtime: { $exists: true, $type: 'date' }, ...query }
}

/**
 * Copies source filter object and add condition to filter out deleted documents.
 *
 * @template T
 * @param {mongodb.Filter<T>} query Filter object.
 * @returns {mongodb.Filter<T>} Extended copy of the source object.
 */
function queryExisted(query) {
  return { dtime: { $exists: false }, ...query }
}

module.exports = {
  dateWithoutTime,
  generateId,
  isDuplicateMongoError,
  isValidationMongoError,
  queryDeleted,
  queryExisted
}
