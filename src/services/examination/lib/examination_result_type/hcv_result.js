'use strict'

/**
 * @typedef {(doc: Partial<Collection.Examination<any>>) => Dict<any>} DocumentFormatFunc
 */

const { responseObjectSet } = require('../../../../libs/http_service_helpers')
const {
  extendJoiWithTestSchema
} = require('../../../../libs/joi_schema_helpers')

const Joi = extendJoiWithTestSchema()

/**
 * Produces response object from a test result document.
 *
 * @param {TestResult.Hcv} doc Test result document.
 * @returns {Dict<any> | undefined} Response document.
 */
function formatTestResultDoc(doc) {
  const response = responseObjectSet({}, [
    ['antihcv', doc?.antihcv],
    ['antihcvigg', doc?.antihcvigg],
    ['antihcvigm', doc?.antihcvigm],
    ['rnahcv', doc?.rnahcv]
  ])

  return Object.keys(response).length ? response : undefined
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
      ['result', formatTestResultDoc(result)],
      ['tests', typeof tests === 'number' ? tests : tests?.length || undefined]
    ])
  },
  /** @type {() => import("joi").ObjectSchema} */
  schema: () =>
    Joi.object({
      antihcv: Joi.test().positive(),
      antihcvigg: Joi.test().positive(),
      antihcvigm: Joi.test().positive(),
      rnahcv: Joi.test().positive()
    }).or('antihcv', 'rnahcv')
})
