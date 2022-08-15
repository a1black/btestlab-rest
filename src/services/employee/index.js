'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')
const express = require('express')

const employeeController = require('./employee_controller')
const {
  fetchUserRequestHandler: fetchUser,
  isAdminRequestHandler: isAdmin,
  verifyJwtRequestHandler: verifyJwt
} = require('../../libs/access_control_helpers')
const { serviceCodeErrorHandler } = require('../../libs/error_handlers')

/** @type {express.RequestHandler} */
function isAdminOrOwner(req, res, next) {
  const admin = req.user?.admin === true
  // @ts-ignore
  const owner = req.user?._id && req.user._id === req.params.id

  next(admin || owner ? undefined : createHttpError(403))
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
    .delete('/:id', isAdminOrOwner, employeeController.deleteEmployee)
    .get('/:id', employeeController.readEmployee)
    .get('/', employeeController.listEmployees)
    .post('/', isAdmin, express.json(), employeeController.createEmployee)
    .put(
      '/:id/password',
      isAdminOrOwner,
      express.json(),
      employeeController.updateEmployeePassword
    )
    .put(
      '/:id',
      isAdminOrOwner,
      express.json(),
      employeeController.updateEmployee
    )
    .use(serviceCodeErrorHandler('employee'))
