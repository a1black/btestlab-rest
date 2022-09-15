'use strict'

const jwt = require('jsonwebtoken')

const objectSet = require('./objectset')
const { capitalize } = require('./utils')

/**
 * Generates access token string.
 *
 * @param {Partial<User>} user Application user data.
 * @param {Configuration["accessToken"] & jwt.SignOptions} options Token sign options.
 * @returns {string} Encoded json web token.
 */
function generateJwt(user, options) {
  const { secret, ...jwtops } = options
  const payload = {}

  objectSet(payload, 'firstname', capitalize(user.firstname))
  objectSet(payload, 'lastname', capitalize(user.lastname))
  objectSet(payload, 'sex', user.sex)
  objectSet(payload, 'admin', user.admin === true ? true : undefined)
  objectSet(jwtops, 'subject', user._id?.toString())

  return jwt.sign(payload, secret, jwtops)
}

module.exports = generateJwt
