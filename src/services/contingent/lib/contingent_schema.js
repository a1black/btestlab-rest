'use strict'

/**
 * @typedef {Object} ContingentSchemaOptions
 * @property {Object} code Unique code validation options.
 * @property {number} code.maxLength Maximum length of input value.
 * @property {RegExp} code.pattern Regular expression to match input value.
 * @property {Object} desc Description text validation options.
 * @property {number} desc.maxLength Maximum length of input value.
 */

const Joi = require('joi')

const {
  baseValidationOptions,
  blankStringSchema,
  collapseSpacesCustomRule
} = require('../../../libs/joi_schema_helpers')

/**
 * @param {ContingentSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} A schema object to validate input data for update operation.
 */
function contingentSchema(options) {
  return Joi.object({
    desc: Joi.string()
      .empty(blankStringSchema())
      .trim()
      .custom(collapseSpacesCustomRule)
      .max(options.desc.maxLength)
      .optional()
  })
    .required()
    .prefs(baseValidationOptions())
}

module.exports = {
  base: contingentSchema,
  /** @type {(options: ContingentSchemaOptions) => Joi.ObjectSchema} Returns a schema object to validate input data for insert operation. */
  full: options =>
    contingentSchema(options).append({
      code: Joi.string()
        .empty(blankStringSchema())
        .trim()
        .lowercase()
        .max(options.code.maxLength)
        .pattern(options.code.pattern)
        .required()
    })
}
