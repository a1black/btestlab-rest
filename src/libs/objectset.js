'use strict'

const { isObject } = require('./type_utils')

/**
 * Sets object property if its value is not `null` or `undefined`.
 *
 * If path points to index in the array, operation is ignored.
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

  if (value === null || value === undefined) {
    return
  } else if (!rest.length) {
    obj[prop] = value
    return
  } else if (!Object.hasOwn(obj, prop)) {
    obj[prop] = {}
  } else if (!isObject(obj[prop])) {
    return
  }

  return objectSet(obj[prop], rest, value)
}

module.exports = objectSet
