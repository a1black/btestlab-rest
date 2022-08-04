'use strict'

const jwt = require('jsonwebtoken')

/**
 * @param {Dict<any>} payload Authentication data.
 * @param {Configuration["accessToken"]} options Generator options.
 * @returns {string}
 */
function generateAccessToken(payload, options) {
  const { id: subject, ...data } = payload
  const { secret, ttl, ...jwtops } = options

  subject && Object.assign(jwtops, { subject })
  ttl && Object.assign(jwtops, { expiresIn: ttl })

  return jwt.sign(data, secret, jwtops)
}

/**
 * Extends HTTP response object with aliases for sending data via `json` method.
 * @param {import('express').Response} res Express HTTP response object.
 */
function httpResponseAliases(res) {
  res.sendOk = ok => res.json({ ok: ok !== false })

  return res
}

/**
 * @param {any} value Value to test.
 * @returns {boolean} Returns `true` if value considered to be `null` by response recipient.
 */
function isNone(value) {
  return (
    value === null ||
    value === undefined ||
    value === false ||
    (typeof value === 'string' && /^\s*$/.test(value))
  )
}

/**
 * @param {Dict<any>} obj The target object to set values to.
 * @param {string|Array<[string, any?]>} property Property name or list of [key, value] pairs to set in the target object.
 * @param {any} [value] Value assigned to `key` property.
 * @returns {Dict<any>} The target object.
 */
function propertySetterOfResponseData(obj, property, value) {
  if (Array.isArray(property)) {
    for (const keyValue of property) {
      propertySetterOfResponseData(obj, ...keyValue)
    }
  } else if (!isNone(value)) {
    obj[property] = value
  }

  return obj
}

module.exports = {
  generateAccessToken,
  httpResponseAliases,
  isNone,
  propertySetterOfResponseData
}
