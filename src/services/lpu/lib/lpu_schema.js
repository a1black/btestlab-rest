'use string'

/**
 * @typedef {Object} LpuSchemaOptions
 * @property {Object} abbr Abbreviation validation options.
 * @property {number} abbr.maxLength Maximum length of input value.
 * @property {Object} name Fullname validation options.
 * @property {number} name.maxLength Maximum length of input value.
 * @property {Object} opf Legal entity name validation options.
 * @property {number} opf.maxLength Maximum length of input value.
 * @property {RegExp} opf.pattern Allowed character set.
 */

const Joi = require('joi')

const emptySchema = () => Joi.string().allow('').pattern(/^\s+$/)
/** @type {(value: any) => any} Collapses consequent spaces in one. */
const collapseSpaces = value =>
  typeof value === 'string' ? value.replaceAll(/\s{2,}/, ' ') : value
/** @type {() => Joi.ValidationOptions} */
const validationOptions = () => ({
  abortEarly: false,
  convert: true,
  errors: { render: false },
  skipFunctions: true,
  stripUnknown: true
})

function lpuCodeSchema() {
  return Joi.number().integer().positive().max(Number.MAX_SAFE_INTEGER)
}

/** @type {(options: { maxLength: number }) => Joi.StringSchema} */
function lpuNameSchema(options) {
  return Joi.string()
    .empty(emptySchema())
    .trim()
    .custom(collapseSpaces)
    .max(options.maxLength)
}

/**
 *
 * @param {LpuSchemaOptions} options Validation options.
 * @returns
 */
function lpuSchema(options) {
  return Joi.object({
    code: lpuCodeSchema().required(),
    dep: lpuCodeSchema().optional(),
    opf: lpuNameSchema(options.opf)
      .uppercase()
      .pattern(options.opf.pattern)
      .required(),
    abbr: lpuNameSchema(options.abbr).required(),
    name: lpuNameSchema(options.name).required()
  }).prefs(validationOptions())
}

module.exports = {
  code: lpuCodeSchema,
  full: lpuSchema,
  /** @type {(schema: Joi.Schema, data?: any) => any} */
  validate: (schema, data) => {
    const { error, value } = schema.validate(data ?? {})
    if (error) {
      throw error
    } else {
      return value
    }
  }
}
