'use strict'

const { isObject, objectSet } = require('./functional_helpers')

/**
 * Extends HTTP response object with aliases for sending data via `res.json()` method.
 *
 * @param {import("express").Response} res Express HTTP response object.
 */
function httpResponseAliases(res) {
  res.sendOk = ok => res.json({ ok: ok !== false })
}

/**
 * @param {any} value Value to test.
 * @returns {boolean} Returns `true` if value considered to be nullish by response recipient.
 */
function isNone(value) {
  return (
    value === null ||
    value === undefined ||
    value === false ||
    (typeof value === 'string' && /^\s*$/.test(value)) ||
    (Array.isArray(value) && !value.length) ||
    (isObject(value) && !Object.keys(value).length) ||
    (value instanceof Map && !value.size) ||
    (value instanceof Set && !value.size)
  )
}

/**
 * Sets property only if its value is not empty.
 *
 * @param {Dict<any>} obj The target object to set values to.
 * @param {string|Array<[string, any?]>} property Property path or list of [key, value] pairs to set in the target object.
 * @param {any} [value] Value assigned to property.
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
  httpResponseAliases,
  responseObjectSet
}
