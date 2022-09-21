'use strict'

/**
 * @typedef {{ keyPattern: Dict<number>, keyValue: Dict<any> }} DuplicateError
 */

const mongodb = require('mongodb')

/**
 * @template T
 * @param {(doc: T) => Promise<mongodb.InferIdType<T>>} callback Method to update or insert document.
 * @param {() => Promise<mongodb.InferIdType<T>> | mongodb.InferIdType<T>} generator Method for generating primary key.
 * @param {number} [attempts=3] Attempts to generate unique primary key before failing.
 * @returns {(doc: T) => Promise<mongodb.InferIdType<T>>} Decorated method.
 */
function generateIdDecorator(callback, generator, attempts = 3) {
  return async doc => {
    while (attempts > 0) {
      try {
        const _id = await generator()
        const response = await callback({ _id, ...doc })

        return response
      } catch (error) {
        if (isDuplicateMongoError(error, '_id')) {
          attempts--
        } else {
          throw error
        }
      }
    }

    throw new Error(
      'Exceeded maximum attempts to generate unique _id for document:\n' +
        JSON.stringify(doc)
    )
  }
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

module.exports = {
  generateIdDecorator,
  isDuplicateMongoError,
  isValidationMongoError
}
