'use strict'

/**
 * @typedef {import("mongodb").Filter<any>} QueryFilter
 */

const objectGet = require('lodash.get')

/**
 * Returns decorator to extend query to match deleted documents.
 *
 * @param {boolean | Date} value Document selection criteria.
 * @returns {(query?: QueryFilter) => QueryFilter} Method that returns new criteria object with applied modifications.
 */
function deletedDocQuery(value) {
  const criteria = value instanceof Date ? value : { $exists: !!value }

  return query => {
    return Object.assign({}, query, { dtime: criteria })
  }
}

/**
 * Returns decorator to extend query to match sub-document.
 *
 * @param {any} doc Possible values for selection criteria.
 * @param  {string[]} fields List of document fields used in criteria.
 * @returns {(query?: QueryFilter) => QueryFilter} Method that returns new criteria object with applied modifications.
 */
function subdocQuery(doc, ...fields) {
  /** @type {Dict<any>} */
  const criteria = {}

  for (const field of fields.length ? fields : Object.keys(doc)) {
    const value = objectGet(doc, field)
    if (value !== null && value !== undefined) {
      criteria[field] = value
    }
  }

  return query => {
    return Object.assign({}, query, criteria)
  }
}

module.exports = {
  deletedDocQuery,
  subdocQuery
}
