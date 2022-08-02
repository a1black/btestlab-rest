'use strict'

const Joi = require('joi')
const createError = require('http-errors')
const express = require('express')

const lpuController = require('./lpu_controller')

module.exports = () =>
  express
    .Router()
    .param('id', (req, res, next, id) => {
      const { error, value } = Joi.number()
        .integer()
        .positive()
        .required()
        .validate(id, { convert: true })
      req.params.lpu = value
      next(error ? createError(404) : undefined)
    })
    .delete('/:id', lpuController.deleteLpu)
    .get('/:id', lpuController.readLpu)
    .get('/', lpuController.listLpus)
    .post('/', lpuController.createLpu)
    .put('/:id/deactivate', lpuController.deactivateLpu)
    .put('/:id/reactivate', lpuController.reactivateLpu)
    .put('/:id/restore', lpuController.restoreLpu)
    .put('/:id', lpuController.updateLpu)
