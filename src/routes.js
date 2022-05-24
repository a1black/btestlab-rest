'use strict'

const express = require('express')

const authService = require('./services/auth')

/**
 * @param {express.Application} [application] Instance of Express application.
 * @returns {express.Application} Application with attached routing middleware.
 */
function routes(application) {
  const app = application ?? express()
  app.use('/auth', authService())

  return app
}

module.exports = routes
