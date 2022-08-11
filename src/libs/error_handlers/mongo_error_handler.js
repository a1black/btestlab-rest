'use strict'

const createHttpError = require('http-errors')
/** @typedef {import("mongodb").MongoError} MongoError */

const { objectSet } = require('../functional_helpers')
const {
  isDuplicateMongoError,
  isValidationMongoError
} = require('../mongodb_helpers')

/**
 * @param {MongoError & { keyPattern?: Dict<any>, keyValue?: Dict<any> }} error Error object.
 * @param {ReturnType<I18nFactoryFunction>} i18n Translator instance.
 * @returns {Dict<any>}
 */
function processDuplicateError(error, i18n) {
  const /** @type {Dict<any>} */ body = {}
  const index = error.keyValue ?? {}
  const keys = Object.entries(error.keyPattern ?? {})
    .filter(([k, v]) => k !== '_id' && !!v)
    .map(v => v[0])

  if (Object.hasOwn(index, '_id')) {
    body.id = index._id
  }

  if (keys.length) {
    body.errors = {}

    for (const key of keys) {
      objectSet(body.errors, key, i18n.t('error.duplicate', { _: 'duplicate' }))
    }
  }

  return body
}

/** @type {import("express").ErrorRequestHandler} */
module.exports = (err, req, res, next) => {
  if (isValidationMongoError(err)) {
    if (err.serviceCode) {
      req.logger.error(
        `mongo:error:json_schema:fail:service:${err.serviceCode}`
      )
    }

    err.expose = false
    err.status = err.statusCode = 500

    next(err)
  } else if (isDuplicateMongoError(err)) {
    next(
      createHttpError(409, 'Document Already Exists', {
        response: processDuplicateError(err, req.i18n())
      })
    )
  } else {
    next(err)
  }
}
