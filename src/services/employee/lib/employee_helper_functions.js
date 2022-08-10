'use strict'

const crypto = require('crypto')

const {
  capitalize,
  dateToShortISOString
} = require('../../../libs/functional_helpers')
const {
  propertySetterOfResponseData
} = require('../../../libs/http_service_helpers')

/**
 * Prepares document to be served by HTTP service.
 *
 * @param {Partial<Collection.Employee>} doc Instance of a database document.
 * @returns {any} Formatted plain object.
 */
function formatEmployeeDoc(doc) {
  return propertySetterOfResponseData({}, [
    ['id', doc._id],
    ['firstname', capitalize(doc.firstname)],
    ['lastname', capitalize(doc.lastname)],
    ['middlename', capitalize(doc.middlename)],
    ['sex', doc.sex],
    ['birthdate', doc.birthdate ? dateToShortISOString(doc.birthdate) : null],
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
  formatEmployeeDoc,
  hashPassword
}
