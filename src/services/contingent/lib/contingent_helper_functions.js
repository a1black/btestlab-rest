'use strict'

/**
 * @typedef {import('express').Request} Request
 */

const urlpath = require('../../../libs/urlpath')
const { responseObjectSet } = require('../../../libs/http_utils')

/**
 * @param {Partial<Collection.Contingent>} doc Internal representation of contingent document.
 * @returns {Dict<number | string>} Formatted plain object.
 */
function formatContingentDoc(doc) {
  return responseObjectSet({}, [
    ['id', doc._id],
    ['desc', doc.desc],
    ['created', doc.ctime?.getTime()],
    ['modified', doc.mtime?.getTime()]
  ])
}

/**
 * @param {Request} req Client HTTP request.
 * @param {Partial<Collection.Contingent>} [doc] Contingent document.
 * @returns {Dict<string>} CRUD links to contingent service.
 */
function linkContingentDoc(req, doc) {
  const basepath = req.config('routes.contingent')
  const url = urlpath([basepath, doc?._id ?? ':id'])

  return responseObjectSet({}, [
    ['create', basepath],
    ['read', url],
    ['update', url],
    ['delete', url]
  ])
}

module.exports = {
  formatContingentDoc,
  linkContingentDoc
}
