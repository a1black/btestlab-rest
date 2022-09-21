'use strict'

/**
 * @typedef {import("joi").CustomHelpers} CustomHelpers
 */

const dateutils = require('../date_utils')

/**
 * Removes reapeting space characters from a string.
 *
 * @param {any} value Validated input value.
 * @returns {any} New string without repeating spaces.
 */
function collapseSpaces(value) {
  return typeof value === 'string' ? value.replaceAll(/\s{2,}/g, ' ') : value
}

/**
 * @param {any} value Validated input value.
 * @param {CustomHelpers} options Schem helper functions.
 * @returns {any} Instance of `Date` with time set to midnight.
 */
function midnight(value, { error }) {
  try {
    return dateutils.dateMidnight(value)
  } catch (err) {
    return error('date.base')
  }
}

/**
 * @param {any} value Validated input value.
 * @param {CustomHelpers} options Schem helper functions.
 * @returns {any} Instance of `Date` with date set to the beginning of the month.
 */
function startOfMonth(value, { error }) {
  const datestr = dateutils.toShortISOString(value)?.replace(/-\d+$/, '-01')

  return datestr ? new Date(datestr) : error('date.base')
}

module.exports = {
  collapseSpaces,
  startOfMonth,
  midnight
}
