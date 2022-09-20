'use strict'

/** @typedef {import("express").RequestHandler} RequestHandler */

const createHttpError = require('http-errors')
const expressJwt = require('express-jwt').expressjwt

const objectSet = require('../objectset')
const { CollectionNameEnum } = require('../../globals')

/**
 * @param {Configuration["accessToken"] & { required?: boolean }} options Verification options.
 * @returns {RequestHandler} Middleware to verify access token.
 */
function verifyJwtMiddleware(options) {
  const { algorithm, required = true, ...jwtops } = options
  const middleware = expressJwt({
    algorithms: [algorithm],
    credentialsRequired: required !== false,
    requestProperty: 'auth',
    ...jwtops
  })

  return async (req, res, next) => {
    await middleware(req, res, error => {
      if (error instanceof Error) {
        throw error
      }
    })

    // @ts-ignore
    const subject = parseInt(req.auth.sub) || undefined
    const user = subject
      ? await req.context.db
          .collection(CollectionNameEnum.USER)
          .findOne({ _id: subject })
      : null
    if (user) {
      // @ts-ignore
      req.user = user
    } else if (subject && !user) {
      throw createHttpError(401, 'The token has been revoked.')
    } else {
      const token = req.auth ?? {}
      objectSet(req, 'user._id', subject)
      objectSet(req, 'user.admin', token.admin === true)
      objectSet(req, 'user.firstname', token.firstname?.toLowerCase())
      objectSet(req, 'user.lastname', token.lastname?.toLowerCase())
      objectSet(req, 'user.middlename', token.middlename?.toLowerCase())
    }

    next()
  }
}

module.exports = verifyJwtMiddleware
