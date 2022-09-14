'use strict'

/** @typedef {import("express").RequestHandler} RequestHandler */

const createHttpError = require('http-errors')
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt').expressjwt

const objectSet = require('./objectset')
const userProvider = require('./user_provider')
const { capitalize } = require('./utils')

/** @type {() => RequestHandler} Returns middleware that loads user using id in the access token. */
function fetchUserRequestHandler() {
  return async (req, res, next) => {
    const token = req.auth

    const user = token?.sub
      ? await userProvider.registrated(token.sub, { source: req.context.db })
      : token
      ? userProvider.anonymous(token)
      : undefined

    if (user) {
      req.user = user
    }

    next(user ? undefined : createHttpError(401))
  }
}

/**
 * Generates access token string.
 *
 * @param {Partial<User>} user Application user data.
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
  objectSet(jwtops, 'subject', user._id?.toString())

  return jwt.sign(payload, secret, jwtops)
}

/** @type {RequestHandler} Returns middleware that authenticated user has admin privileges. */
function isAdminRequestHandler(req, res, next) {
  next(req.user?.admin === true ? undefined : createHttpError(403))
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
  isAdminRequestHandler,
  verifyJwtRequestHandler
}
