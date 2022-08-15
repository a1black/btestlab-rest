'use strict'

const createHttpError = require('http-errors')

const lpuDataAccessor = require('./lpu_data_accessor')
const { formatLpuDoc } = require('./lpu_helper_functions')

/** @type {import("express").ErrorRequestHandler} Extends mongo error to include information on duplicated document. */
module.exports = async (err, req, res, next) => {
  if (lpuDataAccessor.isDuplicateError(err, '_hash') && err.keyValue?._hash) {
    const orig = await lpuDataAccessor(req.context.db).findByHash(
      err.keyValue._hash
    )

    if (orig) {
      err.keyPattern = { abbr: 1 }
      err.keyValue = { _id: orig._id }
      err.response = { doc: formatLpuDoc(orig) }
    } else {
      err = createHttpError(500, 'Try Later')
    }
  }

  next(err)
}
