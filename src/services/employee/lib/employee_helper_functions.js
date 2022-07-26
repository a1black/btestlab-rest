'use strict'

const crypto = require('crypto')

/**
 * Returns HTTP service response data.
 * @param {Collection.Employee} doc Database document instance.
 * @param {{ capitalize: RegExp }} options Formatting options.
 * @returns {any} Formated plain object.
 */
function formatEmployeeDoc(doc, { capitalize }) {
  /** @type {(target: any, name: string, value: any) => void} Set object property. */
  const setter = (target, name, value) => (target[name] = value)
  /** @type {(value: string) => string} Capitalize person name. */
  const capitalizeName = value =>
    value
      .toLocaleLowerCase()
      .replace(capitalize, match => match.toLocaleUpperCase())

  const res = {
    birthdate: doc.birthdate.toISOString().split('T')[0],
    firstname: capitalizeName(doc.firstname),
    lastname: capitalizeName(doc.lastname),
    middlename: capitalizeName(doc.middlename),
    sex: doc.sex
  }

  doc.admin === true && setter(res, 'admin', true)
  doc.ctime && setter(res, 'created', doc.ctime.getTime())
  doc.mtime && setter(res, 'modified', doc.mtime.getTime())

  return res
}

/**
 * @param {{ length: number, prefix: number }} options Generator options.
 * @returns {number} Randomly generated number.
 */
function generateId({ length, prefix }) {
  return (
    crypto.randomInt(Math.pow(10, length) - 1) + prefix * Math.pow(10, length)
  )
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
  generateId,
  hashPassword
}
