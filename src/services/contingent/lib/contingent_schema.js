'use strict'

/**
 * @typedef {Object} ContingentSchemaOptions
 * @property {Object} code Contingent code validation options.
 * @property {number} code.maxLength Maximum length of input value.
 * @property {RegExp} code.pattern Regular expression to match input value.
 * @property {Object} desc Description text validation options.
 * @property {number} desc.maxLength Maximum length of input value.
 */

const Joi = require('joi')

const customRules = require('../../../libs/joi/custom_rules')
const joiutils = require('../../../libs/joi/utils')

const JoiString = () => Joi.string().empty(joiutils.blankStringSchema()).trim()

/**
 * @param {ContingentSchemaOptions["code"]} [options] Validation options.
 * @returns {Joi.StringSchema} Schema to validate contingent code.
 */
function contingentCodeSchema(options) {
  let schema = JoiString().lowercase()

  if (options?.maxLength) {
    schema = schema.max(options.maxLength)
  }
  if (options?.pattern) {
    schema = schema.pattern(options.pattern)
  }

  return schema
}

/**
 * @param {ContingentSchemaOptions["desc"]} options Validation options.
 * @returns {Joi.StringSchema} Schema to validate contingent description.
 */
function contingentDescSchema(options) {
  return JoiString()
    .custom(customRules.collapseSpaces)
    .max(options.maxLength)
    .optional()
}

module.exports = {
  /** @type {() => Joi.StringSchema} Returns schema to validate contingent code. */
  codeParam: () => contingentCodeSchema().required().prefs({ convert: true }),
  /** @type {(options: ContingentSchemaOptions) => Joi.ObjectSchema} Returns schema to validate contingent document. */
  contingentDoc: options =>
    Joi.object({
      code: contingentCodeSchema(options.code).required(),
      desc: contingentDescSchema(options.desc).optional()
    })
      .required()
      .prefs(joiutils.baseValidationOptions()),
  /** @type {(options: ContingentSchemaOptions) => Joi.ObjectSchema} Returns schema for validating input to update contingent document. */
  updateDoc: options =>
    Joi.object({
      desc: contingentDescSchema(options.desc).optional()
    })
      .required()
      .prefs(joiutils.baseValidationOptions())
}
