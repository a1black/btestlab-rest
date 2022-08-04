'use strict'

const crypto = require('crypto')
const { Buffer } = require('buffer')

const {
  propertySetterOfResponseData
} = require('../../../libs/http_service_helpers')

/**
 * Prepares user info to be included as payload of access token.
 *
 * @param {Partial<Collection.Employee>} doc Instance of a database document.
 * @param {{ capitalize: RegExp }} options Formatting options.
 * @returns {Dict<any>} Formatted plain object.
 */
function formatAccessTokenPayload(doc, { capitalize }) {
  const payload = formatUserDoc(doc, { capitalize })
  delete payload.birthdate

  return payload
}

/**
 * Prepares document to be served by HTTP service.
 *
 * @param {Partial<Collection.Employee>} doc Instance of a database document.
 * @param {{ capitalize: RegExp }} options Formatting options.
 * @returns {Dict<any>} Formatted plain object.
 */
function formatUserDoc(doc, { capitalize }) {
  /** @type {(value?: string) => string | undefined} */
  const capitalizeName = value =>
    value?.toLowerCase().replace(capitalize, match => match.toUpperCase())

  return propertySetterOfResponseData({}, [
    ['id', doc._id],
    ['firstname', capitalizeName(doc.firstname)],
    ['lastname', capitalizeName(doc.lastname)],
    ['middlename', capitalizeName(doc.middlename)],
    ['sex', doc.sex],
    ['birthdate', doc.birthdate?.toISOString().split('T')[0]],
    ['admin', doc.admin === true]
  ])
}

/**
 * @param {string} password Plain text password.
 * @param {string} digest Reference hash string.
 * @return {Promise<boolean>} `true` if password matches hash, `false` otherwise.
 */
async function verifyPassword(password, digest) {
  return new Promise((resolve, reject) => {
    const [salt, hash] = digest
      .split(':')
      .map(value => Buffer.from(value, 'base64url'))

    crypto.scrypt(password, salt, hash.byteLength, (err, key) => {
      err ? reject(err) : resolve(key.equals(hash))
    })
  })
}

module.exports = {
  formatAccessTokenPayload,
  formatUserDoc,
  verifyPassword
}
