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

const customRules = require('../../../libs/joi/custom_rules')
const joiutils = require('../../../libs/joi/utils')

/**
 * @param {LpuSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} Schema to validate lpu document.
 */
function lpuInfoSchema(options) {
  return Joi.object({
    abbr: lpuNameSchema(options.abbr).required(),
    opf: lpuNameSchema(options.opf)
      .uppercase()
      .pattern(options.opf.pattern)
      .required()
  })
}

/**
 * @param {{ maxLength: number }} options Validation options.
 * @returns {Joi.StringSchema} Schema to validate lpu name.
 */
function lpuNameSchema(options) {
  return Joi.string()
    .empty(joiutils.blankStringSchema())
    .trim()
    .custom(customRules.collapseSpaces)
    .max(options.maxLength)
}

/**
 * @returns {Joi.BooleanSchema} Schema to validate state value.
 */
function lpuStateSchema() {
  return Joi.boolean().falsy(0).truthy(1).required()
}

module.exports = {
  /** @type {(options: LpuSchemaOptions) => Joi.ObjectSchema} Returns schema to validate lpu input document. */
  lpuDoc: options =>
    lpuInfoSchema(options).required().prefs(joiutils.baseValidationOptions()),
  /** @type {() => Joi.ObjectSchema} Returns schema for validating input to update lpu state. */
  stateDoc: () =>
    Joi.object({ state: lpuStateSchema() })
      .required()
      .prefs(joiutils.baseValidationOptions()),
  /** @type {() => Joi.StringSchema} Returns schema to validate lpu's unique identifier. */
  uidParam: () => Joi.string().lowercase().required().prefs({ convert: true })
}
