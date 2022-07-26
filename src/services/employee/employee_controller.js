'use strict'

/** @typedef {import('express').RequestHandler} RequestHandler */

const createError = require('http-errors')

const employeeProvider = require('./lib/employee_db_provider')
const employeeSchema = require('./lib/employee_schema')
const {
  formatEmployeeDoc,
  hashPassword
} = require('./lib/employee_helper_functions')

/** @type {RequestHandler} Processes POST request to create new application user. */
async function createEmployee(req, res) {
  const { error, value: doc } = employeeSchema
    .full(req.config('input.employee'))
    .validate(req.body ?? {})

  if (error) {
    throw error
  } else if (doc.password) {
    doc.password = await hashPassword(
      doc.password,
      req.config('general.passwdHashSize')
    )
  }

  const id = await employeeProvider(req.context.db).create(
    doc,
    req.config('genops.employee')
  )

  if (!id) {
    throw createError(500, 'Try Later')
  } else {
    res.json({ id })
  }
}

/** @type {RequestHandler} Processes DELETE request to remove employee document from the database. */
async function deleteEmployee(req, res) {
  // @ts-ignore
  const success = await employeeProvider(req.context.db).remove(req.params.id)

  if (success) {
    throw createError(404)
  } else {
    res.json({ ok: true })
  }
}

/** @type {RequestHandler} Processes GET request to fetch data of existing application user. */
async function getEmployeeList(req, res) {
  const employees = []

  for await (const doc of employeeProvider(req.context.db).list()) {
    employees.push(
      formatEmployeeDoc(doc, {
        capitalize: req.config('general.employeeNameCapitalize')
      })
    )
  }

  res.json({ list: employees })
}

/** @type {RequestHandler} Processes GET request to fetch data of existing application user. */
async function readEmployee(req, res) {
  // @ts-ignore
  const employee = await employeeProvider(req.context.db).read(req.params.id)

  if (!employee) {
    throw createError(404)
  } else {
    res.json({
      doc: formatEmployeeDoc(employee, {
        capitalize: req.config('general.employeeNameCapitalize')
      })
    })
  }
}

/** @type {RequestHandler} Processes PUT request to replace employee data with new one. */
async function replaceEmployee(req, res) {
  const { error, value: doc } = employeeSchema
    .base(req.config('input.employee'))
    .validate(req.body ?? {})

  if (error) {
    throw error
  }

  const success = await employeeProvider(req.context.db).replace(
    // @ts-ignore
    req.params.id,
    doc
  )

  if (!success) {
    throw createError(404)
  } else {
    res.json({ ok: true })
  }
}

/** @type {RequestHandler} Processes POST request to change employee authorization password. */
async function updateEmployeePassword(req, res) {
  const { error, value: doc } = employeeSchema
    .password(req.config('input.employee'))
    .validate(req.body ?? {})

  if (error) {
    throw error
  } else {
    doc.password = await hashPassword(doc.password, {
      hashSize: req.config('general.passwdHashSize')
    })
  }

  const success = await employeeProvider(req.context.db).update(
    // @ts-ignore
    req.params.id,
    doc
  )

  if (!success) {
    throw createError(404)
  } else {
    res.json({ ok: true })
  }
}

module.exports = {
  createEmployee,
  deleteEmployee,
  getEmployeeList,
  readEmployee,
  replaceEmployee,
  updateEmployeePassword
}
