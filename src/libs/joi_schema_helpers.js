'use strict'

/**
 * @typedef {{ regex: () => import('joi').AnySchema }} RegexSchema Generates a schema object that matches regular expression.
 */

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

/** Returns a schema object ot match empty or blank string. */
function blankStringSchema() {
  return Joi.string().allow('').pattern(/^\s+$/)
}

/**
 * Removes reapeting space characters from a string.
 * @param {any} value String to check for repeating spaces.
 * @returns {any}
 */
function collapseSpacesCustomRule(value) {
  return typeof value === 'string' ? value.replaceAll(/\s{2,}/, ' ') : value
}
/**
 * Extends Joi root object with schema to match regular expressions.
 * @param {Joi} [joi] Joi root object.
 * @returns {Joi & RegexSchema}
 */
function extendJoiWithRegexSchema(joi) {
  return (joi ?? Joi).extend(joi => ({
    type: 'regex',
    base: joi.any(),
    messages: {
      'regex.base': '{{#label}} must be regex string or a tuple [regex, flags]',
      'regex.empty': '{{#label}} is not allowed to be empty',
      'regex.invalid': '{{#label}} must be valid regular expression'
    },
    /** @param {string|[string, string?]} value */
    validate(value, { error }) {
      try {
        value = typeof value === 'string' ? [value] : value
        if (value instanceof RegExp) {
          return { value }
        } else if (
          !Array.isArray(value) ||
          value.some(v => typeof v !== 'string')
        ) {
          return { errors: error('regex.base') }
        } else if (value[0].trim() === '') {
          return { errors: error('regex.empty') }
        } else {
          return { value: new RegExp(...value) }
        }
      } catch (err) {
        return { errors: error('regex.invalid') }
      }
    }
  }))
}

module.exports = {
  baseValidationOptions,
  blankStringSchema,
  collapseSpacesCustomRule,
  extendJoiWithRegexSchema
}
