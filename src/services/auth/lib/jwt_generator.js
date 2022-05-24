'use strict'

const jwt = require('jsonwebtoken')

/**
 * @param {Collection.Employee} user Instance of application user.
 * @param {Configuration['accessToken']} options JWT generation options.
 * @returns {string} JsonWebToken.
 */
function jwtGenerator(user, options) {
  /** @type {Dict} */
  const payload = {
    firstname: user.firstname,
    lastname: user.lastname,
    middlename: user.middlename,
    sex: user.sex
  }

  if (user.admin) {
    payload[options.adminKey] = true
  }

  return jwt.sign(payload, options.secret, {
    algorithm: options.algorithm,
    expiresIn: options.ttl,
    issuer: options.issuer,
    subject: user._id
  })
}

module.exports = jwtGenerator
