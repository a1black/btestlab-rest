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
 * @param {ContingentSchemaOptions["code"]} [options] Validation options.
 * @returns {Joi.StringSchema} Schema to validate contingent code.
 */
function contingentCodeSchema(options) {
  let schema = Joi.string().empty(blankStringSchema()).trim().lowercase()

  if (options?.maxLength) {
    schema = schema.max(options.maxLength)
  }
  if (options?.pattern) {
    schema = schema.pattern(options.pattern)
  }

  return schema
}

/**
 * @param {ContingentSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} Schema to validate input to update contingent document.
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
  /** @type {() => Joi.StringSchema} Schema to validate contingent code. */
  code: () => contingentCodeSchema().required().prefs({ convert: true }),
  /** @type {(options: ContingentSchemaOptions) => Joi.ObjectSchema} Returns schema to validate contingent document. */
  contingentDoc: options =>
    contingentSchema(options).append({
      code: contingentCodeSchema(options.code).required()
    }),
  updateDoc: contingentSchema
}
