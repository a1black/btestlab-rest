'use strict'

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").RequestHandler} RequestHandler
 *
 * @typedef {Collection.Examination<any>} ExaminationDocument
 */

const createHttpError = require('http-errors')
const { attempt: joiValidate } = require('joi')

const examinationDataAccessor = require('./lib/examination_data_accessor')
const examinationSchema = require('./lib/examination_schema')
const { formatExaminationDoc } = require('./lib/examination_helper_functions')
const { objectSetShallow: objectSet } = require('../../libs/functional_helpers')

/**
 * Returns methods to access document collection.
 *
 * @param {Request} req HTTP request object.
 */
function dataAccessor(req) {
  return examinationDataAccessor(req.context.db)
}

/**
 * @param {Request} req HTTP request object.
 * @returns {ExaminationDocument["uid"]}} Document's unique identifier.
 */
function idParam(req) {
  /** @type {any} */
  const id = {}
  objectSet(id, 'date', req.params.date)
  objectSet(id, 'number', req.params.number)

  return id
}

/**
 * @param {Request} req HTTP request object.
 * @returns {import("./lib/examination_result_type").TestResultHelper}} Test result helper object.
 */
function typeParam(req) {
  // @ts-ignore
  return req.params.type
}

/** @type {RequestHandler} Insertes new document in the database. */
async function createExamination(req, res) {
  const { date } = idParam(req)
  const type = typeParam(req)

  const { number, ...doc } = joiValidate(
    req.body ?? {},
    examinationSchema
      .examination(type.schema, req.config('input.examination'))
      .append({
        number: examinationSchema.number().required()
      })
  )
  // Set examination `type` and `uid` on inserted document
  doc.type = type.name
  doc.uid = {
    date,
    number
  }

  await dataAccessor(req).create(doc, { user: req.user })

  res.json({ id: number })
}

/** @type {RequestHandler} Removes document from the database. */
async function deleteExamination(req, res) {
  // NOTE: Since field `uid` only unique within documents of same type, `type` MUST be provided as part of `uid`.
  const uid = { type: typeParam(req).name, ...idParam(req) }

  const success = await dataAccessor(req).remove(uid, { user: req.user })

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Returns list of documents. */
async function listExaminations(req, res) {
  const { date } = idParam(req)
  const type = typeParam(req)
  const list = []

  for await (const doc of dataAccessor(req).list({ type: type.name, date })) {
    list.push(type.decoratorList(formatExaminationDoc)(doc))
  }

  res.json({ list })
}

/** @type {RequestHandler} Returns a document. */
async function readExamination(req, res) {
  const type = typeParam(req)
  // NOTE: Since field `uid` only unique within documents of same type, `type` MUST be provided as part of `uid`.
  const uid = { type: type.name, ...idParam(req) }

  const doc = await dataAccessor(req).read(uid)

  if (!doc) {
    throw createHttpError(404)
  } else {
    res.json({ doc: type.decoratorDoc(formatExaminationDoc)(doc) })
  }
}

/** @type {RequestHandler} Updates a document. */
async function updateExamination(req, res) {
  const type = typeParam(req)
  const uid = idParam(req)

  /** @type {Collection.OmitBase<ExaminationDocument, "type" | "uid">} */
  const doc = joiValidate(
    req.body ?? {},
    examinationSchema.examination(type.schema, req.config('input.examination'))
  )

  const success = await dataAccessor(req).replace(
    { type: type.name, uid, ...doc },
    { user: req.user }
  )

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

module.exports = {
  createExamination,
  deleteExamination,
  listExaminations,
  readExamination,
  updateExamination
}
