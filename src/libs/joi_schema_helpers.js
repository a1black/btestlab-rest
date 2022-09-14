'use strict'

/**
 * @typedef {import("joi").AnySchema} AnySchema
 * @typedef {{ regex: () => AnySchema }} RegexSchema Generates a schema object that matches regular expression.
 * @typedef {{ test: () => AnySchema & { positive: () => AnySchema } }} TestSchema Generates a schema object that matches test marker.
 */

const Joi = require('joi')

const dateutils = require('./date_utils')
const { TestPositiveEnum } = require('../globals')

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
 * Retruns schema to match empty or blank string.
 *
 * @returns {Joi.StringSchema}
 */
function blankStringSchema() {
  return Joi.string().allow('').pattern(/^\s+$/)
}

/**
 * Removes reapeting space characters from a string.
 *
 * @param {any} value Validated input value.
 * @returns {any} New string without repeating spaces.
 */
function collapseSpacesCustomRule(value) {
  return typeof value === 'string' ? value.replaceAll(/\s{2,}/g, ' ') : value
}

/**
 * Extends Joi root object with schema to match regular expressions.
 *
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
    /** @param {string | [string, string?]} value */
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

/**
 * Extends Joi root object with schema to match test marker.
 *
 * @param {Joi} [joi] Joi root object.
 * @returns {Joi & TestSchema}
 */
function extendJoiWithTestSchema(joi) {
  return (joi ?? Joi).extend(joi => ({
    type: 'test',
    base: joi.any(),
    messages: {
      'test.empty': '{{#label}} is not allowed to be empty',
      'test.positive':
        '{{#label}} must be either positive, negative or indetermined'
    },
    validate(value, { error }) {
      if (typeof value === 'string' && value === '') {
        return { value, errors: error('test.empty') }
      }

      return { value }
    },
    rules: {
      positive: {
        convert: true,
        method() {
          return this.$_addRule('positive')
        },
        validate(value, { error }) {
          const result = joi
            .number()
            .integer()
            .valid(...TestPositiveEnum)
            .validate(value, { convert: true, errors: { render: false } })

          return result.error ? error('test.positive') : result.value
        }
      }
    }
  }))
}

/**
 * Sets time in provided date to '00:00:00.000'.
 *
 * @param {any} value Validated input value.
 * @param {Joi.CustomHelpers} options Schem helper functions.
 * @returns {any} New date object with redacted time.
 */
function unsetTimeInDateCustomRule(value, { error }) {
  try {
    return dateutils.dateMidnight(value)
  } catch (err) {
    return error('date.base')
  }
}

module.exports = {
  baseValidationOptions,
  blankStringSchema,
  collapseSpacesCustomRule,
  extendJoiWithRegexSchema,
  extendJoiWithTestSchema,
  unsetTimeInDateCustomRule
}
