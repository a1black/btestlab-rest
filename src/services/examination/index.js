'use strict'

const createHttpError = require('http-errors')
const express = require('express')

const duplicateErrorHandler = require('./lib/examination_duplicate_error_handler')
const examinationController = require('./examination_controller')
const examinationSchema = require('./lib/examination_schema')
const verifyJwt = require('../../libs/middleware/verify_jwt')
const { joiErrorHandler } = require('../../libs/error_handlers')

/** @type {(config: ApplicationConfiguration) => express.IRouter} */
module.exports = config =>
  express
    .Router()
    .param('date', (req, res, next, date) => {
      const { error, value } = examinationSchema.accountedParam().validate(date)
      req.params.date = value
      next(error ? createHttpError(404) : undefined)
    })
    .param('number', (req, res, next, number) => {
      const { error, value } = examinationSchema.numberParam().validate(number)
      req.params.number = value
      next(error ? createHttpError(404) : undefined)
    })
    .param('type', (req, res, next, type) => {
      const { error, value } = examinationSchema.typeParam().validate(type)
      req.params.type = value
      next(error ? createHttpError(404) : undefined)
    })
    .use(verifyJwt(config.accessToken))
    .delete('/:type/:date/:number', examinationController.deleteExamination)
    .get('/:type/:date/:number', examinationController.readExamination)
    .get('/:type/:date', examinationController.listExaminations)
    .post('/:type', express.json(), examinationController.createExamination)
    .put(
      '/:type/:date/:number',
      express.json(),
      examinationController.updateExamination
    )
    // TODO: Add Duplication error handler
    .use(joiErrorHandler({ prefix: 'examination' }), duplicateErrorHandler)
