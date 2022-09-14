'use strict'

const { isNull, isNumber, isString } = require('./type_utils')

/**
 * @param {number | string | Date} [date="now"] A date expression or current date.
 * @returns {Date} New `Date` instance with time set to midnight.
 */
function dateMidnight(date) {
  const timestamp =
    isNull(date) || date === 'now'
      ? Date.now()
      : isNumber(date) || isString(date)
      ? new Date(date).getTime()
      : date instanceof Date
      ? date.getTime()
      : null
  if (isNull(timestamp) || isNaN(timestamp)) {
    throw new TypeError('The "date" argument must be valid date')
  }

  const delta = timestamp < 0 ? 1 : 0

  return new Date(timestamp - (86400000 * delta + (timestamp % 86400000)))
}

/**
 * @param {any} value Date instance.
 * @returns {string | undefined} Date string in 'YYYY-MM-DD' format.
 */
function dateToShortISOString(value) {
  return value instanceof Date && !isNaN(value.getTime())
    ? value.toISOString().split('T')[0]
    : undefined
}

module.exports = {
  dateMidnight,
  toShortISOString: dateToShortISOString
}
