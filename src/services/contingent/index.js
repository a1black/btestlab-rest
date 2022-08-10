'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')
const express = require('express')

const contingentController = require('./contingent_controller')
const {
  fetchUserRequestHandler: fetchUser,
  verifyJwtRequestHandler: verifyJwt
} = require('../../libs/access_control_helpers')

/** @type {(config: ApplicationConfiguration) => express.IRouter} */
function contingentRouter(config) {
  return express
    .Router()
    .param('code', (req, res, next, code) => {
      const { error, value } = Joi.string()
        .empty('')
        .lowercase()
        .required()
        .validate(code, { convert: true })
      req.params.code = value
      next(error ? createHttpError(404) : undefined)
    })
    .use(verifyJwt(config.accessToken), fetchUser())
    .delete('/:code', contingentController.deleteContingent)
    .get('/:code/history', contingentController.readContingentHistory)
    .get('/:code', contingentController.readContingent)
    .get('/', contingentController.listContingents)
    .post('/', express.json(), contingentController.createContingent)
    .put('/:code', express.json(), contingentController.updateContingent)
}

module.exports = contingentRouter
