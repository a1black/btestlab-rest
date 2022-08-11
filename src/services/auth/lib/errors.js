'use strict'

const ERROR_MAP = {
  basic: 'Invalid Username Or Password',
  pwd: 'Invalid Password',
  user: 'Invalid Username'
}

class AuthenticationError extends Error {
  /**
   * @param {string} [message] Error message.
   */
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    this.status = this.statusCode = 400

    /** @type {string[]} */
    this.credentials = []
  }
}

/**
 * @param {keyof ERROR_MAP} code Type of authentication error.
 * @param {string[]} credentials User's input fields that contain credentials.
 */
function createAuthError(code, ...credentials) {
  const error = new AuthenticationError(ERROR_MAP[code] ?? 'Bad Request')
  error.credentials = credentials

  return error
}

module.exports = createAuthError
module.exports.AuthenticationError = AuthenticationError
/** @type {(error: any) => error is AuthenticationError} */
module.exports.isAuthError = error => error instanceof AuthenticationError
