'use strict'

/**
 * @param {any} value Value to test.
 * @returns {boolean} Returns `true` if value is `null`, `undefined`, `false`, empty collection or blank string.
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

module.exports = {
  /** @type {(value: any) => value is boolean} */
  isBool: value => typeof value === 'boolean' || value instanceof Boolean,
  isNone,
  /** @type {(value: any) => value is null} */
  isNull: value => value === null || value === undefined,
  /** @type {(value: any) => value is number} */
  isNumber: value => typeof value === 'number' || value instanceof Number,
  isObject,
  /** @type {(value: any) => value is string} */
  isString: value => typeof value === 'string' || value instanceof String
}
