'use string'

/**
 * @typedef {Object} LpuSchemaOptions
 * @property {Object} abbr Abbreviation validation options.
 * @property {number} abbr.maxLength Maximum length of input value.
 * @property {Object} name Fullname validation options.
 * @property {number} name.maxLength Maximum length of input value.
 * @property {Object} opf Legal entity name validation options.
 * @property {number} opf.maxLength Maximum length of input value.
 * @property {RegExp} opf.pattern Regular expression to match input value.
 */

const Joi = require('joi')

const {
  baseValidationOptions,
  blankStringSchema,
  collapseSpacesCustomRule
} = require('../../../libs/joi_schema_helpers')

/**
 * @param {{ maxLength: number }} options Validation options.
 * @returns {Joi.StringSchema} A schema object to validate short and full organization name.
 */
function lpuNameSchema(options) {
  return Joi.string()
    .empty(blankStringSchema())
    .trim()
    .custom(collapseSpacesCustomRule)
    .max(options.maxLength)
}

/**
 * @param {LpuSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} A schema object to validate input data for insert and update operations.
 */
function lpuSchema(options) {
  return Joi.object({
    code: Joi.number()
      .integer()
      .positive()
      .max(Number.MAX_SAFE_INTEGER)
      .optional(),
    abbr: lpuNameSchema(options.abbr).required(),
    name: lpuNameSchema(options.name).optional(),
    opf: lpuNameSchema(options.opf)
      .uppercase()
      .pattern(options.opf.pattern)
      .required()
  })
    .required()
    .prefs(baseValidationOptions())
}

module.exports = {
  base: lpuSchema
}
