'use strict'

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("mongodb").MongoError} MongoError
 * @typedef {import("node-polyglot")} Polyglot
 */

const createHttpError = require('http-errors')

const objectSet = require('../objectset')
const {
  isDuplicateMongoError,
  isValidationMongoError
} = require('../mongo/utils')

/**
 * @param {MongoError & { keyPattern: Dict<number> }} err
 * @param {{ i18n: Polyglot }} options
 * @returns {Dict<any>} Translated error messages.
 */
function duplicateErrorResponse(err, { i18n }) {
  const response = {}
  const t = i18n.t.bind(i18n)

  for (const field of Object.keys(err.keyPattern)) {
    objectSet(
      response,
      'errors.' + field,
      t('error.duplicate', { _: 'duplicate' })
    )
  }

  return response
}

/** @type {import("express").ErrorRequestHandler} */
module.exports = (err, req, res, next) => {
  if (isValidationMongoError(err)) {
    req.logger.error('mongo:error:json_schema:fail')
    req.logger.error(err)

    next(createHttpError(500))
  } else if (isDuplicateMongoError(err)) {
    const response = Object.assign(
      err.response ?? {},
      duplicateErrorResponse(err, { i18n: req.i18n() })
    )

    next(createHttpError(409, 'Document Already Exists', { response }))
  } else {
    next(err)
  }
}
