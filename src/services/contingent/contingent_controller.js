'use strict'

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").RequestHandler} RequestHandler
 */

const createHttpError = require('http-errors')
const { attempt: joiValidate } = require('joi')

const contingentDataAccessor = require('./lib/contingent_data_accessor')
const contingentSchema = require('./lib/contingent_schema')
const {
  formatContingentDoc,
  linkContingentDoc
} = require('./lib/contingent_helper_functions')

/**
 * @param {Request} req Client HTTP request.
 */
function dataAccessor(req) {
  return contingentDataAccessor(req.context.db)
}

/**
 * @param {Request} req Client HTTP request.
 * @returns {Collection.Contingent["_id"]} Contingent code passed in URL.
 */
function idparam(req) {
  return req.params.id
}

/** @type {RequestHandler} Creates new contingent document. */
async function createContingent(req, res) {
  const doc = joiValidate(
    req.body ?? {},
    contingentSchema.contingentDoc(req.config('input.contingent'))
  )
  const id = await dataAccessor(req).create(doc)

  res.json({
    links: linkContingentDoc(req, { _id: id })
  })
}

/** @type {RequestHandler} Removes contingent document from the database. */
async function deleteContingent(req, res) {
  const success = await dataAccessor(req).remove(idparam(req))

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Returns list of documents. */
async function listContingents(req, res) {
  const list = []
  for await (const doc of dataAccessor(req).list()) {
    list.push(formatContingentDoc(doc))
  }

  res.json({ links: linkContingentDoc(req), list })
}

/** @type {RequestHandler} Returns contingent document. */
async function readContingent(req, res) {
  const doc = await dataAccessor(req).read(idparam(req))

  if (!doc) {
    throw createHttpError(404)
  } else {
    res.json({
      doc: formatContingentDoc(doc),
      links: linkContingentDoc(req, doc)
    })
  }
}

/** @type {RequestHandler} Updates contingent document. */
async function updateContingent(req, res) {
  /** @type {Collection.OmitBase<Collection.Contingent>} */
  const doc = joiValidate(
    req.body ?? {},
    contingentSchema.updateDoc(req.config('input.contingent'))
  )

  const success = await dataAccessor(req).update({
    _id: idparam(req),
    ...doc
  })

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
  updateContingent
}
