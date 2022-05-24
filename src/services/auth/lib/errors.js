'use strict'

class AuthenticationError extends Error {
  /**
   * @param {Array<[string, string]>} details List of validation errors.
   */
  constructor(details) {
    super()
    this.expose = true
    this.name = this.constructor.name
    this.status = this.statusCode = 400
    this.details = details
  }
}

class InvalidLoginError extends AuthenticationError {
  constructor() {
    super([['login', 'error.auth.login']])
  }
}

class InvalidPasswordError extends AuthenticationError {
  constructor() {
    super([['password', 'error.auth.password']])
  }
}

module.exports = {
  AuthenticationError,
  InvalidLoginError,
  InvalidPasswordError
}
