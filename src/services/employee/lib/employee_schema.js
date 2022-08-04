'use strict'

/**
 * @typedef {Object} EmployeeSchemaOptions
 * @property {Object} name Name validation options.
 * @property {number} name.maxLength Maximum length of input value.
 * @property {RegExp} name.pattern Regular expression to match input value.
 * @property {Object} password Password validation options.
 * @property {number} password.maxLength Maximum length of input value.
 * @property {number} password.minLength Minimum length of input value.
 * @property {RegExp} password.pattern Regular expression to match input value.
 */

const Joi = require('joi')

const { dateSimpleISOFormat } = require('./employee_helper_functions')
const {
  baseValidationOptions,
  blankStringSchema
} = require('../../../libs/joi_schema_helpers')

/**
 * @param {EmployeeSchemaOptions["name"]} options Validation options.
 * @returns {Joi.StringSchema} A schema object to validate human name.
 */
function employeeNameSchema(options) {
  return Joi.string()
    .empty(blankStringSchema())
    .normalize()
    .trim()
    .lowercase()
    .max(options.maxLength)
    .pattern(options.pattern)
}

/**
 * @param {EmployeeSchemaOptions["password"]} options Validation options.
 * @returns {Joi.StringSchema} A schema object to validate raw password value.
 */
function employeePasswordSchema(options) {
  return Joi.string()
    .empty(blankStringSchema())
    .normalize()
    .min(options.minLength)
    .max(options.maxLength)
    .pattern(options.pattern)
}

/**
 * @param {EmployeeSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} A schema object to validate input data for update operation.
 */
function employeeSchema(options) {
  return Joi.object({
    admin: Joi.any().strip().optional(),
    birthdate: Joi.date()
      .empty(blankStringSchema())
      .iso()
      .custom(value => new Date(dateSimpleISOFormat(value)))
      .required(),
    firstname: employeeNameSchema(options.name).required(),
    lastname: employeeNameSchema(options.name).required(),
    middlename: employeeNameSchema(options.name).required(),
    sex: Joi.string().empty(blankStringSchema()).valid('f', 'm').required()
  })
    .required()
    .prefs(baseValidationOptions())
}

module.exports = {
  base: employeeSchema,
  /** @type {(options: EmployeeSchemaOptions) => Joi.ObjectSchema} */
  full: options =>
    employeeSchema(options).append({
      password: employeePasswordSchema(options.password).optional()
    }),
  /** @type {(options: EmployeeSchemaOptions) => Joi.ObjectSchema} */
  password: options =>
    Joi.object({
      password: employeePasswordSchema(options.password).required()
    })
      .required()
      .prefs(baseValidationOptions())
}
