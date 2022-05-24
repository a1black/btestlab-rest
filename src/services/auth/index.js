'use strict'

const express = require('express')

const AuthController = require('./auth_controller')

/**
 * @returns {express.IRouter} Authentication request handlers.
 */
function init() {
  const router = express.Router()

  router.post('/', AuthController.authByLogin)

  return router
}

module.exports = init
