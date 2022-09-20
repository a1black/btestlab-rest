'use strict'

/**
 * @typedef {import("joi").AnySchema} AnySchema
 * @typedef {import("joi").Root} JoiRoot
 */

/** @type {JoiRoot & { test: () => AnySchema & { positive: () => AnySchema }}} */
const Joi = require('joi').extend(
  require('../../../libs/joi/testresult_schema_extension')
)

const customRules = require('../../../libs/joi/custom_rules')
const joiutils = require('../../../libs/joi/utils')
const { ExaminationTypeEnum } = require('../../../globals')

function hcvTestResultSchema() {
  return Joi.object({
    antihcv: Joi.test().positive(),
    antihcvigg: Joi.test().positive(),
    antihcvigm: Joi.test().positive(),
    rnahcv: Joi.test().positive()
  }).or('antihcv', 'rnahcv')
}

function hivTestResultSchema() {
  return Joi.object({
    antihiv: Joi.test().positive(),
    hiv1p24ag: Joi.test().positive(),
    elisa: Joi.string()
      .empty(joiutils.blankStringSchema())
      .trim()
      .custom(customRules.collapseSpaces)
      .max(256)
  }).or('antihiv', 'hiv1p24ag')
}

/**
 * @param {ExaminationType} type Examination type.
 * @returns {(options?: Dict<any>) => import("joi").ObjectSchema}
 */
module.exports = type => {
  const factory =
    type === ExaminationTypeEnum.HCV
      ? hcvTestResultSchema
      : type === ExaminationTypeEnum.HIV
      ? hivTestResultSchema
      : undefined

  if (!factory) {
    throw new Error('Unknown examination type: ' + type)
  }

  return factory
}
