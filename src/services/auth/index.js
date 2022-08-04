'use strict'

const express = require('express')

const AuthController = require('./auth_controller')

/** @type {express.RequestHandler} */
const skipIfInternal = (req, res, next) =>
  next(req.isInternal() ? 'route' : undefined)

module.exports = () =>
  express
    .Router()
    .get('/users', AuthController.listUsers)
    .post('/', express.json(), skipIfInternal, AuthController.loginPasswordAuth)
    .post('/', express.json(), AuthController.trustedAuth)
