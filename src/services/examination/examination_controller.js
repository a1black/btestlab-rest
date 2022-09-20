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
const objectSet = require('../../libs/objectset')
const testResultSchema = require('./lib/test_result_schema')
const {
  formatExaminationDoc,
  linkExaminationDoc
} = require('./lib/examination_helper_functions')

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
 * @returns {examinationDataAccessor.ExaminationIdIndex} Query parameters.
 */
function idparam(req) {
  /** @type {any} */
  const id = {}
  objectSet(id, 'accounted', req.params.date)
  objectSet(id, 'number', req.params.number)
  objectSet(id, 'type', req.params.type)

  return id
}

/** @type {RequestHandler} Creates new examination document or restores deleted. */
async function createExamination(req, res) {
  const { type, ...urlparams } = idparam(req)

  /** @type {Collection.OmitBase<ExaminationDocument>} */
  const doc = joiValidate(
    Object.assign(urlparams, req.body, { type }),
    examinationSchema.examinationDoc(
      testResultSchema(type),
      req.config('input.examination')
    )
  )

  await dataAccessor(req).create(doc, { user: req.user })

  res.json({ links: linkExaminationDoc(req, doc) })
}

/** @type {RequestHandler} Marks examination document as deleted. */
async function deleteExamination(req, res) {
  const success = await dataAccessor(req).remove(idparam(req), {
    user: req.user
  })

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Returns list of examination documents. */
async function listExaminations(req, res) {
  const list = []
  for await (const doc of dataAccessor(req).list(idparam(req))) {
    list.push(formatExaminationDoc(doc))
  }

  res.json({
    defaults: formatExaminationDoc(idparam(req)),
    links: linkExaminationDoc(req, idparam(req)),
    list
  })
}

/** @type {RequestHandler} Returns examination document. */
async function readExamination(req, res) {
  const doc = await dataAccessor(req).read(idparam(req))

  if (!doc) {
    throw createHttpError(404)
  } else {
    res.json({
      doc: formatExaminationDoc(doc),
      links: linkExaminationDoc(req, doc)
    })
  }
}

/** @type {RequestHandler} Replaces examination document with modified version. */
async function updateExamination(req, res) {
  const { type } = idparam(req)
  /** @type {Collection.OmitBase<ExaminationDocument>} */
  const doc = joiValidate(
    Object.assign({}, req.body, idparam(req)),
    examinationSchema.examinationDoc(
      testResultSchema(type),
      req.config('input.examination')
    )
  )

  const success = await dataAccessor(req).replace(doc, { user: req.user })

  if (!success) {
    throw createHttpError(404)
  } else {
    res.json({ links: linkExaminationDoc(req, doc) })
  }
}

module.exports = {
  createExamination,
  deleteExamination,
  listExaminations,
  readExamination,
  updateExamination
}
