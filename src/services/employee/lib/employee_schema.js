'use strict'

/**
 * @typedef {Object} EmployeeSchemaOptions
 * @property {Object} name Employee name validation options.
 * @property {number} name.maxLength Maximum length of input value.
 * @property {RegExp} name.pattern Regular expression to input value.
 * @property {Object} password Employee password validation options.
 * @property {number} password.maxLength Maximum length of input value.
 * @property {number} password.minLength Minimum length of input value.
 * @property {RegExp} password.pattern Allowed character set.
 */

const Joi = require('joi')

const emptySchema = () => Joi.string().allow('').pattern(/^\s+$/)
/** @type {(options: EmployeeSchemaOptions['name']) => Joi.StringSchema} */
const employeeName = options =>
  Joi.string()
    .empty(emptySchema())
    .trim()
    .lowercase()
    .max(options.maxLength)
    .pattern(options.pattern)

/**
 * @param {EmployeeSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} Employee document validation schema.
 */
function employeeSchema(options) {
  return Joi.object({
    admin: Joi.any().strip(),
    birthdate: Joi.date()
      .empty(emptySchema())
      .iso()
      .custom(value => new Date(value.toISOString().split('T')[0]))
      .required(),
    firstname: employeeName(options.name).required(),
    lastname: employeeName(options.name).required(),
    middlename: employeeName(options.name).required(),
    sex: Joi.string().empty(emptySchema()).valid('f', 'm').required()
  }).prefs({})
}

/**
 * @param {EmployeeSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} Employee password validation schema.
 */
function employeePasswordSchema(options) {
  const { password: passwordOps } = options

  return Joi.object({
    password: Joi.string()
      .empty(emptySchema())
      .min(passwordOps.minLength)
      .max(passwordOps.maxLength)
      .pattern(passwordOps.pattern)
  })
}

/** @returns {Joi.ValidationOptions} */
function validationOptions() {
  return {
    abortEarly: false,
    convert: true,
    errors: { render: false },
    skipFunctions: true,
    stripUnknown: true
  }
}

module.exports = {
  /** @type {(options: EmployeeSchemaOptions) => Joi.ObjectSchema} */
  base: options => employeeSchema(options).prefs(validationOptions()),
  /** @type {(options: EmployeeSchemaOptions) => Joi.ObjectSchema} */
  password: options =>
    employeePasswordSchema(options).prefs(validationOptions()),
  /** @type {(options: EmployeeSchemaOptions) => Joi.ObjectSchema} */
  full: options =>
    employeeSchema(options)
      .concat(employeePasswordSchema(options))
      .prefs(validationOptions())
}
