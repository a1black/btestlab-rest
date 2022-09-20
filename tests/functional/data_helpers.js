'use strict'

const crypto = require('crypto')

const config = require('../../src/configs')
const contingentSchema = require('../../src/services/contingent/lib/contingent_schema')
const employeeSchema = require('../../src/services/employee/lib/employee_schema')
const examinationSchema = require('../../src/services/examination/lib/examination_schema')
const lpuSchema = require('../../src/services/lpu/lib/lpu_schema')
const testResultSchema = require('../../src/services/examination/lib/test_result_schema')
const { ExaminationTypeEnum } = require('../../src/globals')

/** @type {() => { code: string, desc: any }} */
function invalidContingent() {
  return { code: '', desc: ['not a string'] }
}

/** @type {() => Partial<Record<keyof Collection.Employee, any>>} */
function invalidEmployee() {
  return {
    birthdate: '',
    firstname: '',
    lastname: '',
    middlename: '',
    sex: '',
    password: ''
  }
}

/** @type {() => Partial<Record<keyof Collection.Lpu, any>>} */
function invalidLpu() {
  return { abbr: '', opf: '' }
}

/**
 * @param {{ locale?: string, size?: number }} [options]
 * @returns {string}
 */
function randomString(options) {
  const { locale = 'en', size = 8 } = options ?? {}
  const alphabet =
    locale === 'ru'
      ? 'абвгдезжиклмнопрстуфхцчшщыьэюя'
      : 'abcdefghijklmnopqrstuvwxyz'

  const result = []
  for (let i = 0; i < size; i++) {
    result.push(alphabet.charAt(Math.floor(Math.random() * alphabet.length)))
  }

  return result.join('')
}

/**
 * @param {string} [id]
 * @returns {Promise<Collection.OmitBase<Collection.Contingent>>}
 */
async function validContingent(id) {
  const options = (await config()).input.contingent
  const code = id ?? crypto.randomInt(1000).toString()
  const { error, value } = contingentSchema.contingentDoc(options).validate({
    code,
    desc: randomString({ locale: 'ru', size: 32 })
  })

  if (error) {
    throw error
  } else {
    return value
  }
}

/** @type {() => Promise<Collection.OmitBase<Collection.Employee>>} */
async function validEmployee() {
  const options = (await config()).input.employee
  const { error, value } = employeeSchema.employeeDoc(options).validate({
    birthdate: new Date(),
    firstname: randomString({ locale: 'ru', size: 16 }),
    lastname: randomString({ locale: 'ru', size: 16 }),
    middlename: randomString({ locale: 'ru', size: 16 }),
    password: randomString({ locale: 'en', size: 8 }),
    sex: Math.random() > 0.5 ? 'f' : 'm'
  })

  if (error) {
    throw error
  } else {
    return value
  }
}

/** @type {() => Promise<Collection.OmitBase<Collection.Examination<TestResult.Hiv> & { _date: string }>>} */
async function validExamination() {
  const date = new Date()
  const result = {
    antihiv: true,
    elisa: randomString({ locale: 'ru', size: 32 }),
    hiv1p24ag: true
  }
  const type = ExaminationTypeEnum.HIV

  const { error, value } = examinationSchema
    .examinationDoc(testResultSchema(type), (await config()).input.examination)
    .validate({
      accounted: date,
      contingent: crypto.randomInt(100, 1000).toString(),
      delivered: new Date(),
      examined: new Date(),
      location: crypto.randomUUID(),
      lpu: crypto.randomUUID(),
      number: crypto.randomInt(1, 1000),
      taken: new Date(),
      type,
      result,
      tests: [
        {
          antihiv: true,
          elisa: randomString({ locale: 'ru', size: 32 }),
          hiv1p24ag: true
        },
        {
          antihiv: true,
          elisa: randomString({ locale: 'ru', size: 32 }),
          hiv1p24ag: true
        },
        result
      ]
    })

  if (error) {
    throw error
  } else {
    return {
      ...value,
      _date:
        date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0')
    }
  }
}

/** @type {() => Promise<Collection.OmitBase<Collection.Lpu>>} */
async function validLpu() {
  const options = (await config()).input.lpu
  const { error, value } = lpuSchema.lpuDoc(options).validate({
    abbr: randomString({ locale: 'ru', size: 16 }),
    opf: randomString({ locale: 'ru', size: 8 })
  })

  if (error) {
    throw error
  } else {
    return value
  }
}

module.exports = {
  invalidContingent,
  invalidEmployee,
  invalidLpu,
  randomString,
  validContingent,
  validEmployee,
  validExamination,
  validLpu
}
