'use strict'

const Joi = require('joi')
const createHttpError = require('http-errors')
const express = require('express')

const ExaminationResultType = require('./lib/examination_result_type')
const examinationController = require('./examination_controller')
const examinationSchema = require('./lib/examination_schema')
const {
  fetchUserRequestHandler: fetchUser,
  verifyJwtRequestHandler: verifyJwt
} = require('../../libs/access_control_helpers')
const { serviceCodeErrorHandler } = require('../../libs/error_handlers')

/** @type {(config: ApplicationConfiguration) => express.IRouter} */
module.exports = config =>
  express
    .Router()
    .param('date', (req, res, next, date) => {
      try {
        req.params.date = Joi.attempt(
          Joi.attempt(date, Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)),
          examinationSchema.partitionDate().required()
        )
        next()
      } catch (error) {
        next(createHttpError(404))
      }
    })
    .param('number', (req, res, next, number) => {
      const { error, value } = examinationSchema
        .number()
        .required()
        .validate(number)
      req.params.number = value
      next(error ? createHttpError(404) : undefined)
    })
    .param('type', (req, res, next, type) => {
      const { value } = Joi.string().lowercase().validate(type)
      // @ts-ignore
      req.params.type = ExaminationResultType(value)
      next(req.params.type ? undefined : createHttpError(404))
    })
    .use(verifyJwt(config.accessToken), fetchUser())
    .delete('/:type/:date/:number', examinationController.deleteExamination)
    .get('/:type/:date/:number', examinationController.readExamination)
    .get('/:type/:date', examinationController.listExaminations)
    .post(
      '/:type/:date',
      express.json(),
      examinationController.createExamination
    )
    .put(
      '/:type/:date/:number',
      express.json(),
      examinationController.updateExamination
    )
    .use(serviceCodeErrorHandler('examination'))
