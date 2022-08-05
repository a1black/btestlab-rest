'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')
const express = require('express')

const lpuController = require('./lpu_controller')
const {
  fetchUserRequestHandler: fetchUser,
  verifyJwtRequestHandler: verifyJwt
} = require('../../libs/access_control_helpers')

/** @type {(config: ApplicationConfiguration) => express.IRouter} */
function lpuRouter(config) {
  return express
    .Router()
    .param('id', (req, res, next, id) => {
      const { error, value } = Joi.number()
        .integer()
        .positive()
        .required()
        .validate(id, { convert: true })
      req.params.lpu = value
      next(error ? createHttpError(404) : undefined)
    })
    .use(verifyJwt(config.accessToken), fetchUser())
    .delete('/:id', lpuController.deleteLpu)
    .get('/:id', lpuController.readLpu)
    .get('/', lpuController.listLpus)
    .post('/', lpuController.createLpu)
    .put('/:id/deactivate', lpuController.deactivateLpu)
    .put('/:id/reactivate', lpuController.reactivateLpu)
    .put('/:id/restore', lpuController.restoreLpu)
    .put('/:id', lpuController.updateLpu)
}

module.exports = lpuRouter
