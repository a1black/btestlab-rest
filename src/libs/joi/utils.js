'use strict'

const Joi = require('joi')

/**
 * @param {Joi.ValidationOptions} [options] Modification to base options.
 * @returns {Joi.ValidationOptions} Returns set of validation options used throughout application.
 */
function baseValidationOptions(options) {
  return Object.assign(
    {
      abortEarly: false,
      convert: true,
      errors: { render: false },
      skipFunctions: true,
      stripUnknown: true
    },
    options ?? {}
  )
}

/**
 * @returns {Joi.StringSchema} Retruns schema to match empty or blank string.
 */
function blankStringSchema() {
  return Joi.string().allow('').pattern(/^\s+$/)
}

module.exports = {
  baseValidationOptions,
  blankStringSchema
}
