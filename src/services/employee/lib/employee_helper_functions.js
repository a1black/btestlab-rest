'use strict'

const crypto = require('crypto')

const {
  propertySetterOfResponseData
} = require('../../../libs/http_service_helpers')

/**
 * @param {Date} date A date object.
 * @returns {string} Date string formatted as 'YYYY-MM-DD'.
 */
function dateSimpleISOFormat(date) {
  return date.toISOString().split('T')[0]
}

/**
 * Prepares document to be served by HTTP service.
 *
 * @param {Partial<Collection.Employee>} doc Instance of a database document.
 * @param {{ capitalize: RegExp }} options Formatting options.
 * @returns {any} Formatted plain object.
 */
function formatEmployeeDoc(doc, { capitalize }) {
  /** @type {(value?: string) => string | undefined} */
  const capitalizeName = value =>
    value?.toLowerCase().replace(capitalize, match => match.toUpperCase())

  return propertySetterOfResponseData({}, [
    ['id', doc._id],
    ['firstname', capitalizeName(doc.firstname)],
    ['lastname', capitalizeName(doc.lastname)],
    ['middlename', capitalizeName(doc.middlename)],
    ['sex', doc.sex],
    ['birthdate', doc.birthdate ? dateSimpleISOFormat(doc.birthdate) : null],
    ['admin', doc.admin === true],
    ['created', doc.ctime?.getTime()],
    ['modified', doc.mtime?.getTime()]
  ])
}

/**
 * @param {string} value Raw password string.
 * @param {{ hashSize: number }} options Password hashing options.
 * @returns {Promise<string>} Hash digest of input password.
 */
function hashPassword(value, { hashSize }) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(hashSize, (err, salt) => {
      err
        ? reject(err)
        : crypto.scrypt(value, salt, hashSize, (err, key) => {
            err
              ? reject(err)
              : resolve(
                  `${salt.toString('base64url')}:${key.toString('base64url')}`
                )
          })
    })
  })
}

module.exports = {
  dateSimpleISOFormat,
  formatEmployeeDoc,
  hashPassword
}
