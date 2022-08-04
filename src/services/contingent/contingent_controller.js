'use strict'

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").RequestHandler} RequestHandler
 */

const createHttpError = require('http-errors')
const { attempt: joiValidate } = require('joi')

const contingentDataAccessor = require('./lib/contingent_data_accessor')
const contingentSchema = require('./lib/contingent_schema')
const { formatContingentDoc } = require('./lib/contingent_helper_functions')

/** @param {Request} req HTTP request object. */
const dataAccessor = req => contingentDataAccessor(req.context.db)
/** @type {(req: Request) => Collection.Contingent["code"]} */
const idParam = req => req.params.code

/** @type {RequestHandler} Insert new document in the database. */
async function createContingent(req, res) {
  /** @type {Collection.OmitBase<Collection.Contingent>} */
  const doc = joiValidate(
    req.body,
    contingentSchema.full(req.config('input.contingent'))
  )

  const code = await dataAccessor(req).create(doc)

  if (!code) {
    throw createHttpError(500, 'Try Later')
  } else {
    res.json({ id: code })
  }
}

/** @type {RequestHandler} Flags requested document as deleted. */
async function deleteContingent(req, res) {
  const success = await dataAccessor(req).remove(idParam(req))

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Returns list of existing (non-deleted) documents. */
async function listContingents(req, res) {
  const list = []
  for await (const doc of dataAccessor(req).list()) {
    list.push(formatContingentDoc(doc))
  }

  res.json({ list })
}

/** @type {RequestHandler} Returns data of an existing (non-deleted) document. */
async function readContingent(req, res) {
  const doc = await dataAccessor(req).read(idParam(req))

  if (!doc) {
    throw createHttpError(404)
  } else {
    res.json({ doc: formatContingentDoc(doc) })
  }
}

/** @type {RequestHandler} Returns document's delete history. */
async function readContingentHistory(req, res) {
  const list = []
  for await (const doc of dataAccessor(req).history(idParam(req))) {
    list.push(formatContingentDoc(doc))
  }

  res.json({ list })
}

/** @type {RequestHandler} Updates data of an existing document. */
async function updateContingent(req, res) {
  /** @type {Collection.OmitBase<Collection.Contingent, "code">} */
  const doc = joiValidate(
    req.body,
    contingentSchema.base(req.config('input.contingent'))
  )

  const success = await dataAccessor(req).update(idParam(req), doc.desc)

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

module.exports = {
  createContingent,
  deleteContingent,
  listContingents,
  readContingent,
  readContingentHistory,
  updateContingent
}
