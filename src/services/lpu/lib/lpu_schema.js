'use string'

/**
 * @typedef {Object} LpuSchemaOptions
 * @property {Object} abbr Abbreviation validation options.
 * @property {number} abbr.maxLength Maximum length of input value.
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
 * @returns {Joi.StringSchema} Schema to validate lpu name components.
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
 * @returns {Joi.ObjectSchema} Schema to validate input document.
 */
function lpuSchema(options) {
  return Joi.object({
    abbr: lpuNameSchema(options.abbr).required(),
    opf: lpuNameSchema(options.opf)
      .uppercase()
      .pattern(options.opf.pattern)
      .required()
  })
    .required()
    .prefs(baseValidationOptions())
}

module.exports = {
  lpuDoc: lpuSchema,
  /** @type {() => Joi.ObjectSchema} Schema to validate state input document. */
  stateDoc: () =>
    Joi.object({ state: Joi.boolean().falsy(0).truthy(1).required() })
      .required()
      .prefs(baseValidationOptions()),
  /** @type {() => Joi.StringSchema} Schema to validate lpu's unique identifier. */
  uid: () => Joi.string().lowercase().required().prefs({ convert: true })
}
