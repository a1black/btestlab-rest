'use strict'

/**
 * @typedef {import("express").ErrorRequestHandler} ErrorRequestHandler
 */

const lpuDataAccessor = require('./lpu_data_accessor')
const objectSet = require('../../../libs/objectset')
const { linkLpuDoc, formatLpuDoc } = require('./lpu_helper_functions')

/** @type {ErrorRequestHandler} Catches Mongo write error raised on duplicating unique index. */
module.exports = async (err, req, res, next) => {
  if (lpuDataAccessor.isDuplicateError(err, 'uid')) {
    const uid = err.keyValue.uid
    const doc = await lpuDataAccessor(req.context.db).read(uid)

    err.keyPattern = { abbr: 1 }
    err.keyValue = { abbr: uid }

    objectSet(err, 'response.doc', doc ? formatLpuDoc(doc) : undefined)
    objectSet(err, 'response.links', doc ? linkLpuDoc(req, doc) : undefined)
  }

  next(err)
}
