'use strict'

/**
 * @typedef {import("express").ErrorRequestHandler} ErrorRequestHandler
 */

const createHttpError = require('http-errors')

const lpuDataAccessor = require('./lpu_data_accessor')
const objectSet = require('../../../libs/objectset')
const { linkLpuDoc, formatLpuDoc } = require('./lpu_helper_functions')

/** @type {ErrorRequestHandler} Catches Mongo write error raised on duplicating unique index. */
module.exports = async (err, req, res, next) => {
  if (lpuDataAccessor.isDuplicateError(err, 'uid')) {
    const doc = await lpuDataAccessor(req.context.db).read(err.keyValue.uid)
    const response = {}

    objectSet(
      response,
      'errors.abbr',
      req.i18n().t('error.duplicate', { _: 'duplicate' })
    )
    objectSet(response, 'doc', doc ? formatLpuDoc(doc) : undefined)
    objectSet(response, 'links', doc ? linkLpuDoc(req, doc) : undefined)

    next(createHttpError(409, 'Document Already Exists', { response }))
  }

  next(err)
}
