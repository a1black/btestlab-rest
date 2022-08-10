'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')
const express = require('express')

const employeeController = require('./employee_controller')
const {
  fetchUserRequestHandler: fetchUser,
  verifyJwtRequestHandler: verifyJwt
} = require('../../libs/access_control_helpers')

/** @type {express.RequestHandler} */
const isAdmin = (req, res, next) => {
  next(req.user?.admin === true ? undefined : createHttpError(403))
}
/** @type {express.RequestHandler} */
const isAdminOrMyself = (req, res, next) => {
  // @ts-ignore
  const /** @type {Collection.InferIdType<User>} */ idParam = req.params.id
  next(
    req.user?.admin === true || (idParam && idParam === req.user?._id)
      ? undefined
      : createHttpError(403)
  )
}
/** @type {express.RequestHandler} */
const notMyself = (req, res, next) => {
  // @ts-ignore
  const /** @type {Collection.InferIdType<User>} */ idParam = req.params.id
  next(idParam && idParam === req.user?._id ? createHttpError(403) : undefined)
}

/** @type {(config: ApplicationConfiguration) => express.IRouter} */
function employeeRouter(config) {
  return express
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
    .delete('/:id', isAdmin, notMyself, employeeController.deleteEmployee)
    .get('/:id', employeeController.readEmployee)
    .get('/', employeeController.listEmployees)
    .post('/', isAdmin, express.json(), employeeController.createEmployee)
    .put(
      '/:id/password',
      isAdminOrMyself,
      express.json(),
      employeeController.updateEmployeePassword
    )
    .put(
      '/:id',
      isAdminOrMyself,
      express.json(),
      employeeController.updateEmployee
    )
}

module.exports = employeeRouter
