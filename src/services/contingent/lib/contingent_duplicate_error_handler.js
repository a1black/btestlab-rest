'use strict'

/**
 * @typedef {import("express").ErrorRequestHandler} ErrorRequestHandler
 */

const createHttpError = require('http-errors')

const contingentDataAccessor = require('./contingent_data_accessor')
const objectSet = require('../../../libs/objectset')
const {
  formatContingentDoc,
  linkContingentDoc
} = require('./contingent_helper_functions')

/** @type {ErrorRequestHandler} Catches Mongo write error raised on duplicating unique index. */
module.exports = async (err, req, res, next) => {
  // NOTE: Code duplication can only be raised on inserting new document.
  if (contingentDataAccessor.isDuplicateError(err, '_id')) {
    const code = err.keyValue._id
    const doc = (await contingentDataAccessor(req.context.db).read(code)) ?? {
      _id: code
    }
    const response = {}

    objectSet(
      response,
      'errors.code',
      req.i18n().t('error.duplicate', { _: 'duplicate' })
    )
    objectSet(response, 'doc', formatContingentDoc(doc))
    objectSet(response, 'links', linkContingentDoc(req, doc))

    next(createHttpError(409, 'Document Already Exists', { response }))
  }

  next(err)
}
