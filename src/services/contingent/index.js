'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')
const express = require('express')

const contingentController = require('./contingent_controller')

module.exports = () =>
  express
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
    .delete('/:code', contingentController.deleteContingent)
    .get('/:code/history', contingentController.readContingentHistory)
    .get('/:code', contingentController.readContingent)
    .get('/', contingentController.listContingents)
    .post('/', contingentController.createContingent)
    .put('/:code', contingentController.updateContingent)
