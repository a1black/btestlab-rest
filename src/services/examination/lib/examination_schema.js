'use strict'

/**
 * @typedef {Object} ExaminationSchemaOptions
 * @property {Object} contingent Validation parameters of contingent code.
 * @property {number} contingent.maxLength Maximum length of input value.
 * @property {Object} date Date validation options.
 * @property {string} date.min Minimal allowed value.
 * @property {Object} name Patient name validation options.
 * @property {number} name.maxLength Maximum length of input value.
 * @property {RegExp} name.pattern Regular expression to match input value.
 * @property {Object} tests Validation options for list of test results.
 * @property {number} tests.maxSize Maximum number of tests.
 */

/** @type {import("joi").Root} */
const Joi = require('joi').extend(
  require('../../../libs/joi/date_schema_extension')
)

const customRules = require('../../../libs/joi/custom_rules')
const joiutils = require('../../../libs/joi/utils')
const { ExaminationTypeEnum, SexEnum } = require('../../../globals')

const JoiString = () => Joi.string().empty(joiutils.blankStringSchema()).trim()

/**
 * Returns schema to validate input data of general information on examination.
 *
 * @param {ExaminationSchemaOptions} options Validation options.
 */
function examinationGeneralInfoSchema(options) {
  return Joi.object({
    contingent: JoiString().max(options.contingent.maxLength).lowercase(),
    lpu: uuidSchema(),
    location: uuidSchema(),
    taken: midnightDateSchema(options.date).max('now'),
    delivered: midnightDateSchema().max('now').min(Joi.ref('taken')),
    examined: midnightDateSchema().max('now').min(Joi.ref('delivered')),
    patient: Joi.object({
      birthdate: midnightDateSchema(options.date).max(Joi.ref('/taken')),
      sex: JoiString().valid(...SexEnum),
      firstname: patientNameSchema(options.name).optional(),
      lastname: patientNameSchema(options.name).optional(),
      middlename: patientNameSchema(options.name).optional(),
      residence: uuidSchema().optional()
    })
      // NOTE: patient input MAY be `null` if patient want to be anonymous.
      .empty(null)
      .optional()
  })
}

/**
 * Returns schema to validate examination number withing a partition.
 */
function examinationNumberSchema() {
  return Joi.number().integer().positive()
}

/**
 * Returns schema to validate examination type input.
 */
function examinationTypeSchema() {
  return JoiString().valid(...ExaminationTypeEnum)
}

/**
 * Returns schema to validate input date and discard time component.
 * @param {ExaminationSchemaOptions["date"]} [options] Validation options.
 */
function midnightDateSchema(options) {
  const schema = Joi.date()
    .empty(joiutils.blankStringSchema())
    .iso()
    .custom(customRules.midnight)

  return options?.min === undefined ? schema : schema.min(options.min)
}

/**
 * Returns schema to validate patient name.
 *
 * @param {ExaminationSchemaOptions["name"]} options Validation options.
 */
function patientNameSchema(options) {
  return JoiString()
    .normalize()
    .custom(customRules.collapseSpaces)
    .max(options.maxLength)
    .lowercase()
    .pattern(options.pattern)
}

/**
 * Returns schema to validate UUID input.
 */
function uuidSchema() {
  return JoiString().length(36).uuid()
}

module.exports = {
  /**
   * @returns {import("joi").DateSchema} schema to validate string containing examination partition key.
   */
  accountedParam: () =>
    // @ts-ignore
    Joi.date().format('yyyymm').required().prefs({ convert: true }),
  /**
   * @param {(options?: ExaminationSchemaOptions) => import("joi").ObjectSchema} testResultSchema Factory method that produces schema to validate test result.
   * @param {ExaminationSchemaOptions} options Validation options.
   */
  examinationDoc: (testResultSchema, options) =>
    examinationGeneralInfoSchema(options)
      .append({
        accounted: midnightDateSchema().custom(customRules.startOfMonth),
        number: examinationNumberSchema(),
        type: examinationTypeSchema(),
        result: testResultSchema(options),
        tests: Joi.array()
          .empty(Joi.array().length(0))
          .items(testResultSchema(options))
          .max(options.tests.maxSize)
          .optional()
      })
      .required()
      .prefs({ presence: 'required', ...joiutils.baseValidationOptions() }),
  /** Returns schema to validate examination's number. */
  numberParam: () =>
    examinationNumberSchema().required().prefs({ convert: true }),
  /** Returns schema to validate examination type value. */
  typeParam: () => examinationTypeSchema().required().prefs({ convert: true })
}
