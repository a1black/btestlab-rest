'use strict'

/**
 * @typedef {(doc: Partial<Collection.Examination<any>>) => Dict<any>} DocumentFormatFunc Document display format function.
 *
 * @typedef {Object} TestResultHelper Helper function to work with test result document.
 * @property {(formatter: DocumentFormatFunc) => DocumentFormatFunc} decoratorDoc Decorator for document format function.
 * @property {(formatter: DocumentFormatFunc) => DocumentFormatFunc} decoratorList Decorator for document format function.
 * @property {ExaminationType} name Examination code.
 * @property {(options?: any) => import("joi").Schema} schema Build schema to validate test result document.
 */

const hcvResult = require('./hcv_result')
const hivResult = require('./hiv_result')
const { ExaminationTypeEnum } = require('../../../../globals')

/**
 * @param {ExaminationType} name Examination code.
 * @param {() => Omit<TestResultHelper, "name">} type Test result helper factory method.
 * @returns {TestResultHelper} Helper object.
 */
function producer(name, type) {
  return Object.assign({ name }, type())
}

/**
 * @param {string} type Examination code.
 * @returns {TestResultHelper?} Test result helper object.
 */
module.exports = type => {
  const helper =
    type === ExaminationTypeEnum.HCV
      ? producer(type, hcvResult)
      : type === ExaminationTypeEnum.HIV
      ? producer(type, hivResult)
      : null

  return helper
}
