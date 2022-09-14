'use strict'

const { isString } = require('./type_utils')

/**
 * Capitalizes each word in a string.
 *
 * @param {any} value Input string.
 * @returns {any} Capitalized string.
 */
function capitalize(value) {
  return isString(value)
    ? value
        .toLowerCase()
        .replaceAll(/(?<=^|\P{L})\p{L}/gu, match => match.toUpperCase())
    : value
}

module.exports = {
  capitalize
}
