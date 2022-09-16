'use strict'

/**
 * @typedef {import('express').Request} Request
 */

const translit = require('../../../libs/transliteration')
const urlpath = require('../../../libs/urlpath')
const { responseObjectSet } = require('../../../libs/http_utils')

/**
 * @param {Partial<Collection.Lpu>} doc Internal representation of lpu document.
 * @returns {Dict<number | string>} Formatted plain object.
 */
function formatLpuDoc(doc) {
  return responseObjectSet({}, [
    ['id', doc._id],
    ['uid', doc.uid],
    ['abbr', doc.abbr],
    ['opf', doc.opf],
    ['disabled', doc.xtime?.getTime()],
    ['created', doc.ctime?.getTime()],
    ['modified', doc.mtime?.getTime()],
    ['deleted', doc.dtime?.getTime()]
  ])
}

/**
 * @param {string} source Value used to generate unique identifier.
 * @returns {string} Unique identifier.
 */
function generateUid(source) {
  return translit(source.trim().toLowerCase())
    .replaceAll(/[-.,:;\s]/g, '_')
    .replaceAll(/[^a-z0-9_]/g, '')
    .replaceAll(/_{2,}/g, '_')
}

/**
 * @param {Request} req Client HTTP request.
 * @param {Partial<Collection.Lpu>} [doc] Lpu document.
 * @returns {Dict<string>} CRUD links to lpu service.
 */
function linkLpuDoc(req, doc) {
  const basepath = req.config('routes.lpu')
  const path = urlpath([basepath, doc?.uid ?? ':uid'])
  const deleted = doc?.dtime instanceof Date || typeof doc?.dtime === 'number'

  return responseObjectSet({}, [
    ['create', basepath],
    ['read', path],
    ['update', deleted ? undefined : path],
    ['delete', deleted ? undefined : path]
  ])
}

module.exports = {
  formatLpuDoc,
  generateUid,
  linkLpuDoc
}
