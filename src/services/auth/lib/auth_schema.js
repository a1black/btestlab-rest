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

const joiuitils = require('../../../libs/joi/utils')

/**
 * @param {LoginPasswordSchemaOptions} options Validation options.
 * @returns {Joi.ObjectSchema} Schema to validate authentication credentials.
 */
function loginPasswordSchema(options) {
  return Joi.object({
    login: Joi.number().integer().positive().required(),
    password: Joi.string()
      .empty(joiuitils.blankStringSchema())
      .normalize()
      .max(options.password.maxLength)
      .min(options.password.minLength)
      .required()
  })
    .required()
    .prefs(joiuitils.baseValidationOptions())
}

module.exports = {
  loginPassword: loginPasswordSchema
}
