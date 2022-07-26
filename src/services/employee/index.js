'use strict'

const Joi = require('joi')
const createError = require('http-errors')
const express = require('express')

const EmployeeController = require('./employee_controller')

function init() {
  return express
    .Router()
    .param('id', (req, res, next, id) => {
      const { error, value } = Joi.number()
        .integer()
        .positive()
        .max(Number.MIN_SAFE_INTEGER)
        .validate(id, { convert: true })
      req.params.id = value
      next(error ? createError(404) : undefined)
    })
    .delete('/:id', EmployeeController.deleteEmployee)
    .get('/:id', EmployeeController.readEmployee)
    .get('/', EmployeeController.getEmployeeList)
    .post('/:id/password', EmployeeController.updateEmployeePassword)
    .post('/', EmployeeController.createEmployee)
    .put('/:id', EmployeeController.replaceEmployee)
}

module.exports = init
