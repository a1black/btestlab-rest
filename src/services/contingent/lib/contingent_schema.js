'use strict'

/**
 * @typedef {Object} ContingentSchemaOptions
 * @property {Object} code Validation schema options for contingent code value.
 * @property {number} code.maxLength Maximum length of input value.
 * @property {RegExp} code.pattern Regular expression to match input value.
 * @property {Object} desc Validation schema options for contingent description text.
 * @property {number} desc.maxLength Maximum length of input value.
 */

const Joi = require('joi')

const emptySchema = () => Joi.string().allow('').pattern(/^\s+$/)
/** @type {(options: ContingentSchemaOptions['code']) => Joi.StringSchema} */
const codeSchema = options =>
  Joi.string()
    .empty(emptySchema())
    .trim()
    .lowercase()
    .max(options.maxLength)
    .pattern(options.pattern)
/** @type {(options: ContingentSchemaOptions['desc']) => Joi.StringSchema} */
const descSchema = options =>
  Joi.string().empty(emptySchema()).trim().max(options.maxLength)
/** @type {() => Joi.ValidationOptions} */
const validationOptions = () => ({
  abortEarly: false,
  convert: true,
  errors: { render: false },
  skipFunctions: true,
  stripUnknown: true
})

/**
 * @param {ContingentSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} Contingent document validation schema.
 */
function contingentSchema(options) {
  return Joi.object({
    code: codeSchema(options.code).required(),
    desc: descSchema(options.desc).optional()
  }).prefs(validationOptions())
}

/**
 * @param {ContingentSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} Validation schema for contingent update object.
 */
function contingentUpdateSchema(options) {
  return Joi.object({
    desc: descSchema(options.desc).optional()
  }).prefs(validationOptions())
}

module.exports = {
  base: contingentUpdateSchema,
  full: contingentSchema,
  /** @type {(schema: Joi.Schema, data?: any) => any} */
  validate: (schema, data) => {
    const { error, value } = schema.validate(data ?? {})
    if (error) {
      throw error
    } else {
      return value
    }
  }
}
