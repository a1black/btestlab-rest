'use strict'

/**
 * @typedef {import("express").ErrorRequestHandler} ErrorRequestHandler
 */

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
    const _id = err.keyValue._id
    const doc = await contingentDataAccessor(req.context.db).read(_id)

    err.keyPattern = { code: 1 }
    err.keyValue = { code: _id }

    objectSet(err, 'response.doc', doc ? formatContingentDoc(doc) : undefined)
    objectSet(err, 'response.links', linkContingentDoc(req, doc ?? { _id }))
  }

  next(err)
}
