'use strict'

class AuthenticationError extends Error {
  /**
   * @param {string | string[]} credential Name of authentication parameter (login, password, token, etc).
   * @param {string} [message] Error message.
   */
  constructor(credential, message) {
    super(message)
    /** @type {string | string[]} Name of authentication parameter (login, password, token, etc). */
    this.credential = credential
  }
}

module.exports = {
  AuthenticationError
}
