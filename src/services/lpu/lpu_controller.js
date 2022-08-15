'use strict'

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').RequestHandler} RequestHandler
 */

const createHttpError = require('http-errors')
const { attempt: joiValidate } = require('joi')

const lpuDataAccessor = require('./lib/lpu_data_accessor')
const lpuSchema = require('./lib/lpu_schema')
const { formatLpuDoc } = require('./lib/lpu_helper_functions')

/** @param {Request} req HTTP request object. */
const dataAccessor = req => lpuDataAccessor(req.context.db)
/** @type {(req: Request) => Collection.InferIdType<Collection.Lpu>} */
// @ts-ignore
const idParam = req => req.params.id

/** @type {RequestHandler} Insert new document in the database. */
async function createLpu(req, res) {
  /**@type {Collection.OmitBase<Collection.Lpu, "_hash">} */
  const doc = joiValidate(req.body, lpuSchema.base(req.config('input.lpu')))
  const collection = dataAccessor(req)

  const id = await collection.create(
    { xtime: new Date(), ...doc },
    req.config('genops.lpuId')
  )

  res.json({ id })
}

/** @type {RequestHandler} Flags requested document as inactive. */
async function deactivateLpu(req, res) {
  const success = await dataAccessor(req).activate(idParam(req), false)

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Returns list of existing (non-deleted) documents. */
async function listLpus(req, res) {
  const list = []
  for await (const doc of dataAccessor(req).list()) {
    list.push(formatLpuDoc(doc))
  }

  res.json({ list })
}

/** @type {RequestHandler} Removes inactivity flag from a document. */
async function reactivateLpu(req, res) {
  const success = await dataAccessor(req).activate(idParam(req), true)

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Returns data of an existing (non-deleted) document. */
async function readLpu(req, res) {
  const doc = await dataAccessor(req).read(idParam(req))

  if (!doc) {
    throw createHttpError(404)
  } else {
    res.json({ doc: formatLpuDoc(doc) })
  }
}

/** @type {RequestHandler} Replaces data of an existing document with recieved one. */
async function updateLpu(req, res) {
  /**@type {Collection.OmitBase<Collection.Lpu, "_hash">} */
  const doc = joiValidate(req.body, lpuSchema.base(req.config('input.lpu')))

  const success = await dataAccessor(req).replace(idParam(req), doc)

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

module.exports = {
  createLpu,
  deactivateLpu,
  listLpus,
  reactivateLpu,
  readLpu,
  updateLpu
}
