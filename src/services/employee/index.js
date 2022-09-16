'use strict'

const createHttpError = require('http-errors')
const express = require('express')

const employeeController = require('./employee_controller')
const employeeSchema = require('./lib/employee_schema')
const verifyJwt = require('../../libs/middleware/verify_jwt')
const privilegeClaims = require('../../libs/middleware/privilege_claims')
const { joiErrorHandler } = require('../../libs/error_handlers')

/** @type {(config: ApplicationConfiguration) => express.IRouter} */
module.exports = config => {
  const claimMiddleware = privilegeClaims([
    'owner',
    // @ts-ignore
    req => req.user._id === req.params.id
  ])

  return express
    .Router()
    .param('id', (req, res, next, id) => {
      const { error, value } = employeeSchema.id().validate(id)

      req.params.id = value
      next(error ? createHttpError(404) : undefined)
    })
    .use(verifyJwt(config.accessToken), claimMiddleware.attach())
    .delete(
      '/:id',
      claimMiddleware.verify('admin', 'owner'),
      employeeController.deleteEmployee
    )
    .get('/:id', employeeController.readEmployee)
    .get('/', employeeController.listEmployees)
    .patch(
      '/:id',
      claimMiddleware.verify('admin', 'owner'),
      express.json(),
      employeeController.updateEmployeePassword
    )
    .post(
      '/',
      claimMiddleware.verify('admin'),
      express.json(),
      employeeController.createEmployee
    )
    .put(
      '/:id',
      claimMiddleware.verify('admin', 'owner'),
      express.json(),
      employeeController.updateEmployee
    )
    .use(joiErrorHandler({ prefix: 'employee' }))
}
