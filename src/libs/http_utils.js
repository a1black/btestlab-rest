'use strict'

const objectSet = require('./objectset')
const { isNone } = require('./type_utils')

/**
 * Sets object property only if its value is not empty.
 *
 * @param {Dict<any>} obj Target object.
 * @param {string|Array<[string, any?]>} property Property path or list of [path, value] pairs.
 * @param {any} [value] Property vlue.
 * @returns {Dict<any>} The target object.
 */
function responseObjectSet(obj, property, value) {
  if (Array.isArray(property)) {
    for (const keyValue of property) {
      responseObjectSet(obj, ...keyValue)
    }
  } else if (!isNone(value)) {
    objectSet(
      obj,
      property,
      value instanceof Map
        ? Object.fromEntries(value.entries())
        : value instanceof Set
        ? [...value.values()]
        : value
    )
  }

  return obj
}

module.exports = {
  responseObjectSet
}
