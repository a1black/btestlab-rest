'use strict'

const crypto = require('crypto')

const {
  propertySetterOfResponseData
} = require('../../../libs/http_service_helpers')

/**
 * Prepares document to be served by HTTP service.
 *
 * @param {Partial<Collection.Lpu>} doc Instance of a database document.
 * @returns {any} Formatted plain object.
 */
function formatLpuDoc(doc) {
  return propertySetterOfResponseData({}, [
    ['id', doc._id],
    ['code', doc.code],
    ['abbr', doc.abbr],
    ['name', doc.name],
    ['opf', doc.opf],
    ['created', doc.ctime?.getTime()],
    ['disabled', doc.xtime?.getTime()],
    ['modified', doc.mtime?.getTime()]
  ])
}

/** @type {(name: string) => string} */
function hashLpuName(name) {
  return crypto
    .createHash('sha1')
    .update(
      name
        .normalize('NFC')
        .toLowerCase()
        .replaceAll(/[^\p{L}\d]+/gu, '')
    )
    .digest()
    .toString('hex')
}

module.exports = {
  formatLpuDoc,
  hashLpuName
}
