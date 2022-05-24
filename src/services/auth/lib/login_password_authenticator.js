'use strict'

const Joi = require('joi')
const crypto = require('crypto')

const dbUserProvider = require('./db_user_provider')
const {
  AuthenticationError,
  InvalidLoginError,
  InvalidPasswordError
} = require('./errors')

/**
 * @typedef {Object} LoginPasswordAuthReq Data structure containing authentication credential.
 * @property {string} login Unique identifier.
 * @property {string} [password] Plain text password.
 * @property {boolean} [trusted=false] Whether or not user can be authenticated without password.
 * @property {string} [type] Type of unique identifier.
 * @property {Collection.Employee} [user] Application user object.
 */

/**
 * Handler of login and password authentication method.
 * @param {import('express').Request} httpRequest POST request with login and password.
 * @returns {Promise<Collection.Employee>} User object if provided credentials are valid.
 * @throws {Error} If user not found or provided password invalid.
 */
async function authenticator(httpRequest) {
  const res = await validateAuthRequest(httpRequest)
    .then(validateAuthLoginIsID)
    .then(req =>
      findUser(
        req,
        dbUserProvider(
          httpRequest.globals.CollectionNameEnum.EMPLOYEE,
          httpRequest.context.db
        )
      )
    )
    .then(verifyPassword)
    .then(verifyTrustedSource)
  if (!res.user) {
    throw new AuthenticationError([
      ['login', 'error.auth.login'],
      ['password', 'error.auth.password']
    ])
  }

  return res.user
}

/**
 * Reads user from the database using provided login.
 * @param {LoginPasswordAuthReq} req Authentication credentials.
 * @param {(key: string, value: string) => Promise<Collection.Employee | null>} provider MongoDB user collection.
 * @returns {Promise<LoginPasswordAuthReq>} Auth credentials and user instance.
 * @throws {Error} If user not found.
 */
async function findUser(req, provider) {
  const user = req.type ? await provider(req.type, req.login) : null
  if (!user) {
    throw new InvalidLoginError()
  } else {
    req.user = user
  }

  return req
}

/**
 * Checks login to be user's ID.
 * @param {LoginPasswordAuthReq} req Authentication credentials.
 * @return {Promise<LoginPasswordAuthReq>} Updated authentication request object.
 */
async function validateAuthLoginIsID(req) {
  const { error } = Joi.object({
    login: Joi.string().regex(/^\d+$/).required(),
    type: Joi.any().forbidden()
  }).validate(req, { allowUnknown: true })

  if (!error) {
    req.type = 'id'
  }

  return req
}

/**
 * Returns validated authentication credentials.
 * @param {import('express').Request} httpRequest HTTP request object.
 * @returns {Promise<LoginPasswordAuthReq>} User credentials.
 * @throws {Error} If request fails validation.
 */
async function validateAuthRequest(httpRequest) {
  const { value: login, error: loginError } = Joi.string()
    .empty('')
    .normalize()
    .lowercase()
    .max(256)
    .optional()
    .validate(httpRequest.body.login, { errors: { render: false } })
  if (loginError) {
    throw new InvalidLoginError()
  } else if (!loginError) {
    throw new AuthenticationError([['login', 'error.generic.required']])
  }

  const { value: password, error: passError } = Joi.string()
    .empty('')
    .normalize()
    .max(64)
    .min(5)
    .presence(httpRequest.isInternal() ? 'optional' : 'required')
    .validate(httpRequest.body.password, { errors: { render: false } })
  if (passError) {
    throw new InvalidPasswordError()
  }

  return {
    login,
    password,
    trusted: httpRequest.isInternal()
  }
}

/**
 * Verifies provided password.
 * @param {LoginPasswordAuthReq} req Authentication credentials.
 * @return {Promise<LoginPasswordAuthReq>}
 * @throws {Error} If password do not match hash in the database.
 */
async function verifyPassword(req) {
  if (req.password && req.user?.password) {
    const [salt, keylen, refHash] = req.user.password.split(':')
    const hash = await new Promise((resolve, reject) => {
      // @ts-ignore
      crypto.scrypt(req.password, salt, parseInt(keylen), (err, key) =>
        err ? reject(err) : resolve(key.toString('hex'))
      )
    })
    if (hash !== refHash) {
      throw new InvalidPasswordError()
    }
  } else if (req.password) {
    throw new InvalidPasswordError()
  }

  return req
}

/**
 * Verifies authentication request from trusted client.
 * @param {LoginPasswordAuthReq} req Authentication credentials.
 * @return {Promise<LoginPasswordAuthReq>}
 * @throws {Error} If password-less authentication not allowed.
 */
async function verifyTrustedSource(req) {
  if (!req.password && req.trusted && !req.user?.admin) {
    return req
  }

  throw new InvalidPasswordError()
}

module.exports = authenticator
