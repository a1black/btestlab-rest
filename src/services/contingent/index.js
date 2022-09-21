'use strict'

const createHttpError = require('http-errors')
const express = require('express')

const contingentController = require('./contingent_controller')
const contingentSchema = require('./lib/contingent_schema')
const duplicateErrorHandler = require('./lib/contingent_duplicate_error_handler')
const verifyJwt = require('../../libs/middleware/verify_jwt')
const { joiErrorHandler } = require('../../libs/error_handlers')

/** @type {(config: ApplicationConfiguration) => express.IRouter} */
module.exports = config =>
  express
    .Router()
    .param('id', (req, res, next, id) => {
      const { error, value } = contingentSchema.codeParam().validate(id)
      req.params.id = value
      next(error ? createHttpError(404) : undefined)
    })
    .use(verifyJwt(config.accessToken))
    .delete('/:id', contingentController.deleteContingent)
    .get('/:id', contingentController.readContingent)
    .get('/', contingentController.listContingents)
    .post('/', express.json(), contingentController.createContingent)
    .put('/:id', express.json(), contingentController.updateContingent)
    .use(joiErrorHandler({ prefix: 'contingent' }), duplicateErrorHandler)
