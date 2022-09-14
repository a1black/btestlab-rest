'use strict'

const crypto = require('crypto')
const { Buffer } = require('buffer')

const dateutils = require('../../../libs/date_utils')
const { capitalize } = require('../../../libs/utils')
const { responseObjectSet } = require('../../../libs/http_utils')

/**
 * @param {Partial<User>} doc Instance of a database document.
 * @returns {Dict<any>} Formatted plain object.
 */
function formatUserDoc(doc) {
  return responseObjectSet({}, [
    ['id', doc._id],
    ['firstname', capitalize(doc.firstname)],
    ['lastname', capitalize(doc.lastname)],
    ['middlename', capitalize(doc.middlename)],
    ['birthdate', dateutils.toShortISOString(doc.birthdate)],
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
  formatUserDoc,
  verifyPassword
}
