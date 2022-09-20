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
    /** @type {import("./examination_data_accessor").ExaminationIdIndex} */
    // @ts-ignore
    const examid = err.keyValue
    const doc = await examinationDataAccessor(req.context.db).read(examid)

    objectSet(err, 'response.doc', doc ? formatExaminationDoc(doc) : null)
    objectSet(err, 'response.links', linkExaminationDoc(req, doc ?? examid))
  }

  next(err)
}
