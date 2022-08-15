'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')
const express = require('express')

const lpuController = require('./lpu_controller')
const duplicateErrorHandler = require('./lib/lpu_duplicate_error_handler')
const {
  fetchUserRequestHandler: fetchUser,
  isAdminRequestHandler: isAdmin,
  verifyJwtRequestHandler: verifyJwt
} = require('../../libs/access_control_helpers')
const { serviceCodeErrorHandler } = require('../../libs/error_handlers')

/** @type {(config: ApplicationConfiguration) => express.IRouter} */
module.exports = config =>
  express
    .Router()
    .param('id', (req, res, next, id) => {
      const { error, value } = Joi.number()
        .integer()
        .positive()
        .required()
        .validate(id, { convert: true })
      req.params.id = value
      next(error ? createHttpError(404) : undefined)
    })
    .use(verifyJwt(config.accessToken), fetchUser())
    .get('/:id', lpuController.readLpu)
    .get('/', lpuController.listLpus)
    .post('/', isAdmin, express.json(), lpuController.createLpu)
    .put('/:id/activate', lpuController.reactivateLpu)
    .put('/:id/deactivate', lpuController.deactivateLpu)
    .put('/:id', express.json(), lpuController.updateLpu)
    .use(serviceCodeErrorHandler('lpu'), duplicateErrorHandler)
