'use strict'

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").RequestHandler} RequestHandler
 */

const authSchema = require('./lib/auth_schema')
const userDataAccessor = require('./lib/user_data_accessor')
const { AuthenticationError } = require('./lib/errors')
const {
  formatAccessTokenPayload,
  formatUserDoc,
  verifyPassword
} = require('./lib/auth_helper_functions')

/** @param {Request} req HTTP request object. */
const dataAccessor = req => userDataAccessor(req.context.db)

/** @type {RequestHandler} Processes authentication with user credentials. */
async function loginPasswordAuth(req, res) {
  const {
    error,
    value: { login, password }
  } = authSchema.loginPassword(req.config('input.auth')).validate(req.body)

  const user = error ? null : await dataAccessor(req).read(login)
  const matched = user?.password
    ? await verifyPassword(password, user.password)
    : false

  if (!matched) {
    throw new AuthenticationError(['login', 'password'])
  } else if (user?.admin && !user.password) {
    throw new Error(`No password for admin user: '${user._id}'`)
  }

  const accessToken = req.generateAccessToken(
    // @ts-ignore
    formatAccessTokenPayload(user, {
      capitalize: req.config('general.employeeNameCapitalize')
    })
  )

  res.json({ accessToken })
}

/** @type {RequestHandler} Returns list of application users. */
async function listUsers(req, res) {
  const list = []
  for await (const doc of dataAccessor(req).list()) {
    list.push(
      formatUserDoc(doc, {
        capitalize: req.config('general.employeeNameCapitalize')
      })
    )
  }

  res.json({ list })
}

/** @type {RequestHandler} Processes authentication from trusted source. */
async function trustedAuth(req, res) {
  const schema = authSchema.loginPassword(req.config('input.auth'))
  const { error, value: login } = schema
    .extract('login')
    .validate(req.body?.login)

  const user = error ? null : await dataAccessor(req).read(login)

  if (!user) {
    throw new AuthenticationError('login')
  } else if (user.admin && user.password) {
    const { error, value: password } = schema
      .extract('password')
      .validate(req.body?.password)

    const matched = error
      ? false
      : await verifyPassword(password, user.password)

    if (!matched) {
      throw new AuthenticationError('password')
    }
  } else if (user.admin) {
    throw new Error(`No password for admin user: '${user._id}'`)
  }

  const accessToken = req.generateAccessToken(
    formatAccessTokenPayload(user, {
      capitalize: req.config('general.employeeNameCapitalize')
    })
  )

  res.json({ accessToken })
}

module.exports = {
  loginPasswordAuth,
  listUsers,
  trustedAuth
}
