'use strict'

const createHttpError = require('http-errors')
const express = require('express')

const lpuController = require('./lpu_controller')
const lpuSchema = require('./lib/lpu_schema')
const duplicateErrorHandler = require('./lib/lpu_duplicate_error_handler')
const verifyJwt = require('../../libs/middleware/verify_jwt')
const { joiErrorHandler } = require('../../libs/error_handlers')

/** @type {express.RequestHandler} */
function isStatusUpdate(req, res, next) {
  // NOTE: Update request MUST contain replacement document or new state value.
  next(req.body?.state === undefined ? 'route' : undefined)
}

/** @type {(config: ApplicationConfiguration) => express.IRouter} */
module.exports = config =>
  express
    .Router()
    .param('uid', (req, res, next, uid) => {
      const { error, value } = lpuSchema.uid().validate(uid)
      req.params.uid = value
      next(error ? createHttpError(404) : undefined)
    })
    .use(verifyJwt(config.accessToken))
    .delete('/:uid', lpuController.deleteLpu)
    .get('/:uid', lpuController.readLpu)
    .get('/', lpuController.listLpus)
    .post('/', express.json(), lpuController.createLpu)
    .put('/:uid', express.json(), isStatusUpdate, lpuController.updateLpuState)
    .put('/:uid', express.json(), lpuController.updateLpu)
    .use(joiErrorHandler({ prefix: 'lpu' }), duplicateErrorHandler)
