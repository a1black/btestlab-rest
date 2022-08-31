'use strict'

/**
 * @typedef {(doc: Partial<Collection.Examination<any>>) => Dict<any>} DocumentFormatFunc
 *
 * @typedef {Object} TestResultSchemaOptions
 * @property {Object} text Text field validation options.
 * @property {number} text.maxLength Maximum length of input value.
 */

const { responseObjectSet } = require('../../../../libs/http_service_helpers')
const {
  blankStringSchema,
  extendJoiWithTestSchema
} = require('../../../../libs/joi_schema_helpers')

const Joi = extendJoiWithTestSchema()

/**
 * Produces response object from a test result document.
 *
 * @param {TestResult.Hiv} doc Test result document.
 * @param {"doc" | "list"} [target="doc"] Type of response document.
 * @returns {Dict<any> | undefined} Response document.
 */
function formatTestResultDoc(doc, target = 'doc') {
  const response = responseObjectSet({}, [
    ['antihiv', doc?.antihiv],
    ['hiv1p24ag', doc?.hiv1p24ag]
  ])

  if (target === 'doc') {
    responseObjectSet(response, 'elisa', doc?.elisa)
  }

  return Object.keys(response).length ? response : undefined
}

/**
 * Returns schema to validate text input.
 *
 * @param {TestResultSchemaOptions["text"]} [options] Validation options.
 * @returns {import("joi").StringSchema} String validation schema.
 */
function stringSchema(options) {
  const { maxLength } = options ?? {}
  const schema = Joi.string().empty(blankStringSchema).trim()

  return maxLength ? schema.max(maxLength) : schema
}

module.exports = () => ({
  /** @type {(callable: DocumentFormatFunc) => DocumentFormatFunc} */
  decoratorDoc: callable => doc => {
    return responseObjectSet(callable(doc), [
      ['result', formatTestResultDoc(doc.result)],
      ['tests', doc.tests?.map(v => formatTestResultDoc(v)).filter(v => !!v)]
    ])
  },
  /** @type {(callable: DocumentFormatFunc) => DocumentFormatFunc} */
  decoratorList: callable => doc => {
    const { result, tests } = doc

    return responseObjectSet(callable(doc), [
      ['result', formatTestResultDoc(result, 'list')],
      ['tests', typeof tests === 'number' ? tests : tests?.length || undefined]
    ])
  },
  /** @type {(options?: TestResultSchemaOptions) => import("joi").ObjectSchema} */
  schema: options =>
    Joi.object({
      antihiv: Joi.test().positive(),
      hiv1p24ag: Joi.test().positive(),
      elisa: stringSchema(options?.text).required()
    }).or('antihiv', 'hiv1p24ag')
})
