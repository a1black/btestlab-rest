'use strict'

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').RequestHandler} RequestHandler
 */

const createHttpError = require('http-errors')

const lpuProvider = require('./lib/lpu_db_provider')
const lpuSchema = require('./lib/lpu_schema')
const { formatLpuDoc } = require('./lib/lpu_helper_functions')

/** @param {Request} req */
const lpuCollection = req => lpuProvider(req.context.db)
/** @type {(req: Request) => import('mongodb').InferIdType<Collection.Lpu>} */
// @ts-ignore
const idParam = req => req.params.id

/** @type {RequestHandler} Creates new LPU document. */
async function createLpu(req, res) {
  const doc = lpuSchema.validate(
    lpuSchema.full(req.config('input.lpu')),
    req.body
  )

  try {
    const id = await lpuCollection(req).create(doc, req.config('genops.lpu'))

    if (!id) {
      throw createHttpError(500, 'Try Later')
    } else {
      res.json({ id })
    }
  } catch (error) {
    // TODO: Response error must provide a way to restore deleted document.
    // @ts-ignore
    if (error.code === 11000 && error.keyPattern?.code) {
      const deletedDoc = await lpuCollection(req).readDeleted(doc)
      if (deletedDoc) {
        // @ts-ignore
        error.keyPattern = { _id: 1 }
        // @ts-ignore
        error.keyValue = { _id: deletedDoc._id }
      }

      throw error
    }
  }
}

/** @type {RequestHandler} Flags LPU document as inactive. */
async function deactivateLpu(req, res) {
  const success = await lpuCollection(req).activate(idParam(req), false)

  if (!success) {
    throw createHttpError(404)
  } else {
    res.json({ ok: true })
  }
}

/** @type {RequestHandler} Flags LPU document as deleted. */
async function deleteLpu(req, res) {
  const success = await lpuCollection(req).remove(idParam(req))

  if (!success) {
    throw createHttpError(404)
  } else {
    res.json({ ok: true })
  }
}

/** @type {RequestHandler} Returns list of existing (non-deleted) LPU documents. */
async function listLpus(req, res) {
  const list = []
  for await (const doc of lpuCollection(req).list()) {
    list.push(formatLpuDoc(doc))
  }

  res.json({ list })
}

/** @type {RequestHandler} Removes inactivity flag from LPU document. */
async function reactivateLpu(req, res) {
  const success = await lpuCollection(req).activate(idParam(req), true)

  if (!success) {
    throw createHttpError(404)
  } else {
    res.json({ ok: true })
  }
}

/** @type {RequestHandler} Returns data of existing (non-deleted) LPU document. */
async function readLpu(req, res) {
  const doc = await lpuCollection(req).read(idParam(req))

  if (!doc) {
    throw createHttpError(404)
  } else {
    res.json({ doc: formatLpuDoc(doc) })
  }
}

/** @type {RequestHandler} Restores deleted LPU document to its previous state. */
async function restoreLpu(req, res) {
  const success = await lpuCollection(req).restore(idParam(req))

  if (!success) {
    throw createHttpError(404)
  } else {
    res.json({ ok: true })
  }
}

/** @type {RequestHandler} Replaces data of existing LPU document with recieved one. */
async function updateLpu(req, res) {
  const doc = lpuSchema.validate(
    lpuSchema.full(req.config('input.lpu')),
    req.body
  )

  const success = await lpuCollection(req).replace(idParam(req), doc)

  if (!success) {
    throw createHttpError(404)
  } else {
    res.json({ ok: true })
  }
}

module.exports = {
  createLpu,
  deactivateLpu,
  deleteLpu,
  listLpus,
  reactivateLpu,
  readLpu,
  restoreLpu,
  updateLpu
}
