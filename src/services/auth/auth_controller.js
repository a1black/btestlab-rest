'use strict'

const authLoginPassword = require('./lib/login_password_authenticator')
const jwtGenerator = require('./lib/jwt_generator')

/**
 * Processes basic "login & password" authentication request.
 *
 * @type {import('express').RequestHandler}
 */
async function authByLogin(req, res) {
  const user = await authLoginPassword(req)
  const accessToken = jwtGenerator(user, req.context.config.accessToken)

  res.json({ accessToken })
}

module.exports = {
  authByLogin
}
