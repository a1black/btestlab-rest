'use strict'

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
    ['dep', doc.dep],
    ['opf', doc.opf],
    ['abbr', doc.abbr],
    ['name', doc.name],
    ['created', doc.ctime?.getTime()],
    ['deleted', doc.dtime?.getTime()],
    ['disabled', doc.xtime?.getTime()]
  ])
}

module.exports = {
  formatLpuDoc
}
