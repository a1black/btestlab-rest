'use strict'

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').RequestHandler} RequestHandler
 */

const createHttpError = require('http-errors')
const { attempt: joiValidate } = require('joi')

const lpuDataAccessor = require('./lib/lpu_data_accessor')
const lpuSchema = require('./lib/lpu_schema')
const {
  formatLpuDoc,
  generateUid,
  linkLpuDoc
} = require('./lib/lpu_helper_functions')

/**
 * @param {Request} req Client HTTP request.
 */
function dataAccessor(req) {
  return lpuDataAccessor(req.context.db)
}

/**
 * @param {Request} req Client HTTP request.
 * @returns {Collection.Lpu["uid"]} Document's unique identifier.
 */
function idparam(req) {
  return req.params.uid
}

/** @type {RequestHandler} Creates new lpu or restores deleted. */
async function createLpu(req, res) {
  /**@type {Omit<Collection.Lpu, "uid">} */
  const input = joiValidate(
    req.body ?? {},
    lpuSchema.lpuDoc(req.config('input.lpu'))
  )

  const uid = generateUid(input.abbr)

  await dataAccessor(req).create({ uid, ...input })

  res.json({ links: linkLpuDoc(req, { uid }) })
}

/** @type {RequestHandler} Marks lpu as deleted. */
async function deleteLpu(req, res) {
  const success = await dataAccessor(req).remove(idparam(req))

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Returns list of lpu documents. */
async function listLpus(req, res) {
  const list = []
  for await (const doc of dataAccessor(req).list()) {
    list.push(formatLpuDoc(doc))
  }

  res.json({ links: linkLpuDoc(req), list })
}

/** @type {RequestHandler} Returns lpu document. */
async function readLpu(req, res) {
  const doc = await dataAccessor(req).read(idparam(req))

  if (!doc) {
    throw createHttpError(404)
  } else {
    res.json({ doc: formatLpuDoc(doc), links: linkLpuDoc(req, doc) })
  }
}

/** @type {RequestHandler} Replaces lpu document with modified version. */
async function updateLpu(req, res) {
  /**@type {Collection.OmitBase<Collection.Lpu, "uid">} */
  const input = joiValidate(
    req.body ?? {},
    lpuSchema.lpuDoc(req.config('input.lpu'))
  )
  const uid = generateUid(input.abbr)

  const success = await dataAccessor(req).replace(idparam(req), {
    uid,
    ...input
  })

  if (!success) {
    throw createHttpError(404)
  } else {
    res.json({ links: linkLpuDoc(req, { uid }) })
  }
}

/** @type {RequestHandler} Updates state of lpu document. */
async function updateLpuState(req, res) {
  const { state } = joiValidate(req.body ?? {}, lpuSchema.stateDoc())

  const success = await dataAccessor(req).activate(idparam(req), state)

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

module.exports = {
  createLpu,
  deleteLpu,
  listLpus,
  readLpu,
  updateLpu,
  updateLpuState
}
