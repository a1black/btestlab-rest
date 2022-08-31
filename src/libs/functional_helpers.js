'use strict'

/**
 * Capitalizes each word in a string.
 *
 * @param {any} value Input string.
 * @returns {any} Capitalized string.
 */
function capitalize(value) {
  return typeof value === 'string'
    ? value
        .toLowerCase()
        .replaceAll(/(?<=^|\P{L})\p{L}/gu, match => match.toUpperCase())
    : value
}

/** @type {(date?: Date) => string | undefined} Convert `Date` to 'YYYY-MM-DD' formated string. */

/**
 * Returns specified date as a string in 'YYYY-MM-DD' format.
 *
 * @param {Date} [date] Date object.
 * @returns {string | undefined} Formatted date string.
 */
function dateToShortISOString(date) {
  return date?.toISOString().split('T')[0]
}

/**
 * @param {any} value Tested value.
 * @returns {boolean} Returns `true` if argument is plain object, `false` otherwise.
 */
function isObject(value) {
  return (
    value !== undefined &&
    value !== null &&
    Object.getPrototypeOf(Object.getPrototypeOf(value)) === null
  )
}

/** @type {(obj: Dict<any>, prop: string, value?: any) => void} Adds property to a target object if value is not Null. */

/**
 * Sets property in the target object if its value is not `null` or `undefined`.
 *
 * @param {any} obj Target object.
 * @param {string} property Property name.
 * @param {any} value Property value.
 * @returns {void}
 */
function objectSetShallow(obj, property, value) {
  if (value !== undefined && value !== null) {
    obj[property] = value
  }
}

/**
 * Sets property in the object using provided path and value.
 *
 * @param {Dict<any>} obj Target object.
 * @param {Array<number | string> | number | string} path The path to the property.
 * @param {any} value Property value.
 * @returns {void}
 */
function objectSet(obj, path, value) {
  const [prop, ...rest] =
    typeof path === 'string'
      ? path.split('.')
      : !Array.isArray(path)
      ? [path]
      : path

  if (!rest.length) {
    obj[prop] = value
    return
  } else if (!Object.hasOwn(obj, prop)) {
    obj[prop] = {}
  } else if (!isObject(obj[prop])) {
    return
  }

  return objectSet(obj[prop], rest, value)
}

module.exports = {
  capitalize,
  dateToShortISOString,
  isObject,
  objectSet,
  objectSetShallow
}
