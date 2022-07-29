'use strict'

const Joi = require('joi')
const createError = require('http-errors')
const express = require('express')

const contingentController = require('./contingent_controller')

function initContingentEndpoint() {
  return express
    .Router()
    .param('code', (req, res, next, code) => {
      const { error, value } = Joi.string()
        .lowercase()
        .required()
        .validate(code)
      req.params.code = value
      next(error ? createError(404) : undefined)
    })
    .delete('/:code', contingentController.deleteContingent)
    .get('/:code', contingentController.readContingent)
    .get('/', contingentController.listContingents)
    .get('/history/:code', contingentController.deleteHistoryOfContingent)
    .post('/', contingentController.createContingent)
    .put('/:code', contingentController.updateContingent)
}

module.exports = initContingentEndpoint
