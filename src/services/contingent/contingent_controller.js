'use strict'

/** @typedef {import('express').RequestHandler} RequestHandler */

const createError = require('http-errors')

const contingentProvider = require('./lib/contingent_db_provider')
const contingentSchema = require('./lib/contingent_schema')
const { formatContingentDoc } = require('./lib/contingent_helper_functions')

/** @type {RequestHandler} Processes POST request to create new contingent document. */
async function createContingent(req, res) {
  const doc = contingentSchema.validate(
    contingentSchema.full(req.config('input.contingent')),
    req.body
  )

  const code = await contingentProvider(req.context.db).create(doc)

  if (!code) {
    throw createError(500, 'Try Later')
  } else {
    res.json({ id: code })
  }
}

/** @type {RequestHandler} Processes DELETE request to mark contingent document as deleted. */
async function deleteContingent(req, res) {
  const success = await contingentProvider(req.context.db).remove(
    req.params.code
  )

  if (!success) {
    throw createError(404)
  } else {
    res.json({ ok: true })
  }
}

/** @type {RequestHandler} Processes GET request to fetch deleted entries for specified contingent code. */
async function deleteHistoryOfContingent(req, res) {
  const list = []
  for await (const doc of contingentProvider(req.context.db).history(
    req.params.code
  )) {
    list.push(formatContingentDoc(doc))
  }

  res.json({ list })
}

/** @type {RequestHandler} Processes GET request to fetch list of active contingents. */
async function listContingents(req, res) {
  const list = []
  for await (const doc of contingentProvider(req.context.db).list()) {
    list.push(formatContingentDoc(doc))
  }

  res.json({ list })
}

/** @type {RequestHandler} Processes GET request to fetch data of active contingent document. */
async function readContingent(req, res) {
  const doc = await contingentProvider(req.context.db).read(req.params.code)

  if (doc) {
    res.json({ doc: formatContingentDoc(doc) })
  } else {
    throw createError(404)
  }
}

/** @type {RequestHandler} Processes PUT request to update contingent document. */
async function updateContingent(req, res) {
  const updDoc = contingentSchema.validate(
    contingentSchema.base(req.config('input.contingent')),
    req.body
  )

  const success = await contingentProvider(req.context.db).update(
    req.params.code,
    updDoc
  )

  if (!success) {
    throw createError(404)
  } else {
    res.json({ ok: true })
  }
}

module.exports = {
  createContingent,
  deleteContingent,
  deleteHistoryOfContingent,
  listContingents,
  readContingent,
  updateContingent
}
