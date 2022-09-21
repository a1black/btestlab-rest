'use strict'

/**
 * @typedef {Object} EmployeeSchemaOptions
 * @property {Object} birthdate Date validation options.
 * @property {string} birthdate.min Minimal allowed value.
 * @property {Object} name Employee name validation options.
 * @property {number} name.maxLength Maximum length of input value.
 * @property {RegExp} name.pattern Regular expression to match input value.
 * @property {Object} password Password validation options.
 * @property {number} password.maxLength Maximum length of input value.
 * @property {number} password.minLength Minimum length of input value.
 * @property {RegExp} password.pattern Regular expression to match input value.
 */

const Joi = require('joi')

const customRules = require('../../../libs/joi/custom_rules')
const joiutils = require('../../../libs/joi/utils')
const { SexEnum } = require('../../../globals')

const JoiString = () => Joi.string().empty(joiutils.blankStringSchema()).trim()

/**
 * @returns {Joi.NumberSchema} Schema to validate employee ID.
 */
function employeeIdSchema() {
  return Joi.number().integer().positive()
}

/**
 * @param {EmployeeSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} Schema to validate employee personal information.
 */
function employeeInfoSchema(options) {
  return Joi.object({
    admin: Joi.any().strip().optional(),
    birthdate: Joi.date()
      .empty(joiutils.blankStringSchema())
      .iso()
      .custom(customRules.midnight)
      .max('now')
      .min(options.birthdate.min)
      .required(),
    firstname: employeeNameSchema(options.name).required(),
    lastname: employeeNameSchema(options.name).required(),
    middlename: employeeNameSchema(options.name).required(),
    sex: JoiString()
      .valid(...SexEnum)
      .required()
  })
}

/**
 * @param {EmployeeSchemaOptions["name"]} options Validation options.
 * @returns {Joi.StringSchema} Schema to validate employee's name.
 */
function employeeNameSchema(options) {
  return JoiString()
    .normalize()
    .custom(customRules.collapseSpaces)
    .max(options.maxLength)
    .lowercase()
    .pattern(options.pattern)
}

/**
 * @param {EmployeeSchemaOptions["password"]} options Validation options.
 * @returns {Joi.StringSchema} Schema to validate raw password.
 */
function employeePasswordSchema(options) {
  return Joi.string()
    .empty(joiutils.blankStringSchema())
    .normalize()
    .min(options.minLength)
    .max(options.maxLength)
    .pattern(options.pattern)
}

module.exports = {
  /** @type {(options: EmployeeSchemaOptions) => Joi.ObjectSchema} Returns schema to validate input document. */
  employeeDoc: options =>
    employeeInfoSchema(options)
      .append({
        password: employeePasswordSchema(options.password).optional()
      })
      .required()
      .prefs(joiutils.baseValidationOptions()),
  /** @type {() => Joi.NumberSchema} Returns schema to validate employee identifier. */
  idParam: () => employeeIdSchema().required().prefs({ convert: true }),
  /** @type {(options: EmployeeSchemaOptions) => Joi.ObjectSchema} Retruns schema to validate password update. */
  passwordDoc: options =>
    Joi.object({
      password: employeePasswordSchema(options.password).required()
    })
      .required()
      .prefs(joiutils.baseValidationOptions()),
  /** @type {(options: EmployeeSchemaOptions) => Joi.ObjectSchema} Returns schema for validating input to update employee document. */
  updateDoc: options =>
    employeeInfoSchema(options)
      .required()
      .prefs(joiutils.baseValidationOptions())
}
