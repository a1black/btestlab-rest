'use strict'

const {
  propertySetterOfResponseData
} = require('../../../libs/http_service_helpers')

/**
 * Prepares document to be served by HTTP service.
 *
 * @param {Partial<Collection.Contingent>} doc Instance of a database document.
 * @returns {any} Formatted plain object.
 */
function formatContingentDoc(doc) {
  return propertySetterOfResponseData({}, [
    ['id', doc.code],
    ['desc', doc.desc],
    ['created', doc.ctime?.getTime()],
    ['deleted', doc.dtime?.getTime()]
  ])
}

module.exports = {
  formatContingentDoc
}
