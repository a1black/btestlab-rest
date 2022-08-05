'use strict'

/** @typedef {import("express").RequestHandler} RequestHandler */

const createHttpError = require('http-errors')
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt').expressjwt

const userProvider = require('./user_provider')
const { capitalize, objectSet } = require('./functional_helpers')

/** @type {() => RequestHandler} Returns middleware that loads user using id in the access token. */
function fetchUserRequestHandler() {
  return async (req, res, next) => {
    const user = req.auth?.sub
      ? await userProvider(req.auth.sub, { source: req.context.db })
      : null
    const error = !user && req.auth?.sub ? createHttpError(401) : undefined

    if (user) {
      req.user = user
    }

    next(error)
  }
}

/**
 * @param {User} user Application user data.
 * @param {Configuration["accessToken"] & jwt.SignOptions} options Token sign options.
 * @returns {string} Encoded json web token.
 */
function generateUserJwt(user, options) {
  const { secret, ...jwtops } = options
  const payload = {}

  objectSet(payload, 'firstname', capitalize(user.firstname))
  objectSet(payload, 'lastname', capitalize(user.lastname))
  objectSet(payload, 'sex', user.sex)
  objectSet(payload, 'admin', user.admin === true ? true : undefined)

  return jwt.sign(payload, secret, {
    subject: user._id.toString(),
    ...jwtops
  })
}

/**
 * Returns middleware that verifies access token recieved with HTTP request.
 *
 * @param {Configuration["accessToken"] & { required?: boolean }} options
 * @returns {RequestHandler} Express request handler.
 */
function verifyJwtRequestHandler(options) {
  const { algorithm, required = true, ...jwtops } = options

  return expressJwt({
    algorithms: [algorithm],
    credentialsRequired: required !== false,
    ...jwtops
  })
}

module.exports = {
  fetchUserRequestHandler,
  generateUserJwt,
  verifyJwtRequestHandler
}
