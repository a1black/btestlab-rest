'use strict'

const express = require('express')

const authController = require('./auth_controller')
const authErrorHandler = require('./lib/auth_error_handler')

/** @type {express.RequestHandler} */
function skipIfInternal(req, res, next) {
  next(req.isInternal() ? 'route' : undefined)
}

module.exports = () =>
  express
    .Router()
    .get('/users', authController.listUsers)
    .post('/', express.json(), skipIfInternal, authController.loginPasswordAuth)
    .post('/', express.json(), authController.trustedAuth)
    .use(authErrorHandler)
