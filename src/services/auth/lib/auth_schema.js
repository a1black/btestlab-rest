'use strict'

/**
 * @typedef {Object} LoginPasswordSchemaOptions
 * @property {Object} login Login validation options.
 * @property {number} login.maxLength Maximum length of input value.
 * @property {Object} password Password validation options.
 * @property {number} password.maxLength Maximum length of input value.
 * @property {number} password.minLength Minimal length of input value.
 */

const Joi = require('joi')

const {
  baseValidationOptions,
  blankStringSchema
} = require('../../../libs/joi_schema_helpers')

/**
 * @param {LoginPasswordSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} A schema object to validate authentication credentials.
 */
function loginPasswordSchema(options) {
  return Joi.object({
    login: Joi.string()
      .empty(blankStringSchema())
      .normalize()
      .trim()
      .lowercase()
      .max(options.login.maxLength)
      .required(),
    password: Joi.string()
      .empty(blankStringSchema())
      .normalize()
      .max(options.password.maxLength)
      .min(options.password.minLength)
      .required()
  })
    .required()
    .prefs(baseValidationOptions())
}

module.exports = {
  loginPassword: loginPasswordSchema
}
