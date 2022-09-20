'use strict'

/**
 * @typedef {import("express").ErrorRequestHandler} ErrorRequestHandler
 */

const examinationDataAccessor = require('./examination_data_accessor')
const objectSet = require('../../../libs/objectset')
const {
  formatExaminationDoc,
  linkExaminationDoc
} = require('./examination_helper_functions')

/** @type {ErrorRequestHandler} Catches Mongo write error raised on duplicating unique index. */
module.exports = async (err, req, res, next) => {
  if (
    examinationDataAccessor.isDuplicateError(err, 'accounted', 'number', 'type')
  ) {
    // @ts-ignore
    const doc = await examinationDataAccessor(req.context.db).read(err.keyValue)

    objectSet(err, 'response.doc', doc ? formatExaminationDoc(doc) : null)
    objectSet(err, 'response.links', doc ? linkExaminationDoc(req, doc) : null)
  }

  next(err)
}
