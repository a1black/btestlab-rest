'use strict'

const crypto = require('crypto')

const config = require('../../src/configs')
const contingentSchema = require('../../src/services/contingent/lib/contingent_schema')
const employeeSchema = require('../../src/services/employee/lib/employee_schema')
const lpuSchema = require('../../src/services/lpu/lib/lpu_schema')

/** @type {() => Collection.OmitBase<Collection.Contingent>} */
function invalidContingent() {
  return { code: '', desc: '' }
}

/** @type {() => Collection.OmitBase<Collection.Employee>} */
function invalidEmployee() {
  return {
    // @ts-ignore
    birthdate: '',
    firstname: '',
    lastname: '',
    middlename: '',
    sex: '',
    password: ''
  }
}

/** @type {() => Collection.OmitBase<Collection.Lpu>} */
function invalidLpu() {
  return { abbr: '', code: 0, name: '', opf: '' }
}

/** @type {() => Promise<Collection.OmitBase<Collection.Contingent>>} */
async function validContingent() {
  const options = (await config()).input.contingent
  const code = crypto.randomInt(1000).toString()
  const { error, value } = contingentSchema
    .full(options)
    .validate({ code, desc: code })
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
    firstname: 'firstname',
    lastname: 'lastname',
    middlename: 'middlename',
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
