'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')
const express = require('express')

const lpuController = require('./lpu_controller')
const {
  fetchUserRequestHandler: fetchUser,
  verifyJwtRequestHandler: verifyJwt
} = require('../../libs/access_control_helpers')
const { serviceCodeErrorHandler } = require('../../libs/error_handlers')

/** @type {express.RequestHandler} */
function isAdmin(req, res, next) {
  next(req.user?.admin === true ? undefined : createHttpError(403))
}

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
    .delete('/:id', isAdmin, lpuController.deleteLpu)
    .get('/:id', lpuController.readLpu)
    .get('/', lpuController.listLpus)
    .post('/', isAdmin, express.json(), lpuController.createLpu)
    .put('/:id/deactivate', lpuController.deactivateLpu)
    .put('/:id/reactivate', lpuController.reactivateLpu)
    .put('/:id/restore', lpuController.restoreLpu)
    .put('/:id', express.json(), lpuController.updateLpu)
    .use(serviceCodeErrorHandler('lpu'))
