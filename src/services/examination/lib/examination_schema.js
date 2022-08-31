'use strict'

/**
 * @typedef {Object} ExaminationSchemaOptions
 * @property {Object} date Date validation options.
 * @property {string} date.min Minimal allowed value.
 * @property {Object} name Patient name validation options.
 * @property {number} name.maxLength Maximum length of input value.
 * @property {RegExp} name.pattern Regular expression to match input value.
 * @property {Object} tests Validation options for list of test results.
 * @property {number} tests.maxSize Maximum number of tests.
 * @property {Object} text Text field validation options.
 * @property {number} text.maxLength Maximum length of input value.
 */

const Joi = require('joi')

const { SexEnum } = require('../../../globals')
const {
  baseValidationOptions,
  blankStringSchema,
  collapseSpacesCustomRule,
  unsetTimeInDateCustomRule
} = require('../../../libs/joi_schema_helpers')

/**
 * @returns {Joi.DateSchema} Base schema to discard time from date input value.
 */
function dateZeroTimeSchema() {
  return Joi.date()
    .empty(blankStringSchema())
    .iso()
    .custom(unsetTimeInDateCustomRule)
}

/**
 * @param {ExaminationSchemaOptions["name"]} options Validation options.
 * @returns {Joi.StringSchema} Schema to validate patient name.
 */
function patientNameSchema(options) {
  return Joi.string()
    .empty(blankStringSchema())
    .normalize()
    .trim()
    .lowercase()
    .custom(collapseSpacesCustomRule)
    .max(options.maxLength)
    .pattern(options.pattern)
}

/**
 * @returns {Joi.StringSchema} Schema to validate UUID string.
 */
function uuidSchema() {
  return stringSchema().lowercase().uuid()
}

/**
 * @param {ExaminationSchemaOptions["text"]} [options] Validation options.
 * @returns {Joi.StringSchema} Schema to validate string value.
 */
function stringSchema(options) {
  const schema = Joi.string().empty(blankStringSchema).trim()

  return options?.maxLength ? schema.max(options.maxLength) : schema
}

/**
 * @param {ExaminationSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} Schema to validate input document.
 */
function examinationSchema(options) {
  return Joi.object({
    contingent: stringSchema(options.text).lowercase(),
    lpu: Joi.number().integer().positive(),
    location: uuidSchema(),
    taken: dateZeroTimeSchema().max('now'),
    delivered: dateZeroTimeSchema().max('now').min(Joi.ref('taken')),
    examined: dateZeroTimeSchema().max('now').min(Joi.ref('delivered')),
    patient: Joi.object({
      birthdate: dateZeroTimeSchema()
        .max(Joi.ref('/taken'))
        .min(options.date.min),
      sex: stringSchema().valid(...SexEnum),
      firstname: patientNameSchema(options.name).optional(),
      lastname: patientNameSchema(options.name).optional(),
      middlename: patientNameSchema(options.name).optional(),
      residence: uuidSchema().optional()
    })
      // NOTE: patient input MAY be `null` if patient want to be anonymous.
      .empty(null)
      .optional()
  })
    .required()
    .prefs({ presence: 'required', ...baseValidationOptions() })
}

module.exports = {
  base: examinationSchema,
  /**
   * @param {(options?: ExaminationSchemaOptions) => Joi.Schema} resultSchema A function that produces schema to validate test result document.
   * @param {ExaminationSchemaOptions} options Validation options.
   * @returns {Joi.ObjectSchema} Schema to validate input data.
   */
  examination: (resultSchema, options) =>
    examinationSchema(options).append({
      result: resultSchema(options).required(),
      tests: Joi.array()
        .empty(Joi.array().length(0))
        .items(resultSchema(options))
        .max(options.tests.maxSize)
        .optional()
    }),
  /** @returns {Joi.NumberSchema} Schema to validate examination's number field. */
  number: () => Joi.number().integer().positive(),
  /** @returns {Joi.DateSchema} Schema to validate date partition key. */
  partitionDate: () => dateZeroTimeSchema()
}
