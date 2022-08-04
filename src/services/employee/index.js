'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')
const express = require('express')

const employeeController = require('./employee_controller')

module.exports = () =>
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
    .delete('/:id', employeeController.deleteEmployee)
    .get('/:id', employeeController.readEmployee)
    .get('/', employeeController.listEmployees)
    .post('/', employeeController.createEmployee)
    .put('/:id/password', employeeController.updateEmployeePassword)
    .put('/:id', employeeController.updateEmployee)
