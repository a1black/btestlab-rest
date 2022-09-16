'use strict'

/**
 * @typedef {import("express").Request} Request
 */

const crypto = require('crypto')

const dateutils = require('../../../libs/date_utils')
const urlpath = require('../../../libs/urlpath')
const { responseObjectSet } = require('../../../libs/http_utils')
const { capitalize } = require('../../../libs/utils')

/**
 * @param {Partial<Collection.Employee>} doc Internal representation of employee document.
 * @returns {Dict<boolean | number | string>} Formatted plain object.
 */
function formatEmployeeDoc(doc) {
  return responseObjectSet({}, [
    ['id', doc._id],
    ['firstname', capitalize(doc.firstname)],
    ['lastname', capitalize(doc.lastname)],
    ['middlename', capitalize(doc.middlename)],
    ['sex', doc.sex],
    ['birthdate', dateutils.toShortISOString(doc.birthdate)],
    ['admin', doc.admin === true],
    ['created', doc.ctime?.getTime()],
    ['modified', doc.mtime?.getTime()]
  ])
}

/**
 * @param {string} value Raw password string.
 * @param {{ hashSize: number }} options Password hashing options.
 * @returns {Promise<string>} Hash string.
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

/**
 * @param {Request} req Client HTTP request.
 * @param {Partial<Collection.Employee>} [doc] Employee document.
 * @returns {Dict<string>} CRUD links to employee service.
 */
function linkEmployeeDoc(req, doc) {
  const basepath = req.config('routes.employee')
  const path = urlpath([basepath, doc?._id ?? ':id'])

  return responseObjectSet({}, [
    ['create', req.claim('admin') ? basepath : undefined],
    ['read', path],
    ['update', req.claim('admin', 'owner') ? path : undefined],
    ['delete', req.claim('admin', 'owner') ? path : undefined]
  ])
}

module.exports = {
  formatEmployeeDoc,
  hashPassword,
  linkEmployeeDoc
}
