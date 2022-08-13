'use strict'

const crypto = require('crypto')

const config = require('../../src/configs')
const contingentSchema = require('../../src/services/contingent/lib/contingent_schema')
const employeeSchema = require('../../src/services/employee/lib/employee_schema')
const lpuSchema = require('../../src/services/lpu/lib/lpu_schema')

/** @type {() => Partial<Record<keyof Collection.Contingent, any>>} */
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
  return { abbr: '', code: 1.2, dep: 'not number', name: '', opf: '' }
}

/**
 * @param {string} [id]
 * @returns {Promise<Collection.OmitBase<Collection.Contingent>>}
 */
async function validContingent(id) {
  const options = (await config()).input.contingent
  const code = id ?? crypto.randomInt(1000).toString()
  const { error, value } = contingentSchema
    .full(options)
    .validate({ code, desc: crypto.randomBytes(64).toString('utf-8') })
  if (error) {
    throw error
  } else {
    return value
  }
}

/** @type {() => Promise<Collection.OmitBase<Collection.Employee>>} */
async function validEmployee() {
  const options = (await config()).input.employee
  const { error, value } = employeeSchema.full(options).validate({
    birthdate: new Date(),
    firstname: 'Имя',
    lastname: 'Фамилия',
    middlename: 'Отчество',
    password: '1234567890',
    sex: 'm'
  })
  if (error) {
    throw error
  } else {
    return value
  }
}

/** @type {() => Promise<Collection.OmitBase<Collection.Lpu>>} */
async function validLpu() {
  const options = (await config()).input.lpu
  const { error, value } = lpuSchema.base(options).validate({
    abbr: 'abbr',
    code: crypto.randomInt(1000),
    dep: crypto.randomInt(1000),
    name: 'name',
    opf: 'опф'
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
  validContingent,
  validEmployee,
  validLpu
}
