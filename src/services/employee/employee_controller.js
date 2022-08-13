'use strict'

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").RequestHandler} RequestHandler
 */

const createHttpError = require('http-errors')
const { attempt: joiValidate } = require('joi')

const employeeDataAccessor = require('./lib/employee_data_accessor')
const employeeSchema = require('./lib/employee_schema')
const {
  formatEmployeeDoc,
  hashPassword
} = require('./lib/employee_helper_functions')

/** @param {Request} req HTTP request object. */
const dataAccessor = req => employeeDataAccessor(req.context.db)
/** @type {(req: Request) => Collection.InferIdType<Collection.Employee>} */
// @ts-ignore
const idParam = req => req.params.id

/** @type {RequestHandler} Insert new document in the database. */
async function createEmployee(req, res) {
  /** @type {Collection.OmitBase<Collection.Employee, "admin">} */
  const doc = joiValidate(
    req.body,
    employeeSchema.full(req.config('input.employee'))
  )

  if (doc.password) {
    doc.password = await hashPassword(doc.password, {
      hashSize: req.config('general.passwdHashSize')
    })
  }

  const id = await dataAccessor(req).create(
    doc,
    req.config('genops.employeeId')
  )

  res.json({ id })
}

/** @type {RequestHandler} Removes requested document from the database. */
async function deleteEmployee(req, res) {
  const success = await dataAccessor(req).remove(idParam(req))

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Returns list of existing documents. */
async function listEmployees(req, res) {
  const list = []
  for await (const doc of dataAccessor(req).list()) {
    list.push(formatEmployeeDoc(doc))
  }

  res.json({ list })
}

/** @type {RequestHandler} Returns data of an existing document. */
async function readEmployee(req, res) {
  const doc = await dataAccessor(req).read(idParam(req))

  if (!doc) {
    throw createHttpError(404)
  } else {
    res.json({ doc: formatEmployeeDoc(doc) })
  }
}

/** @type {RequestHandler} Updates data of an existing document. */
async function updateEmployee(req, res) {
  /** @type {Collection.OmitBase<Collection.Employee, "password">} */
  const doc = joiValidate(
    req.body,
    employeeSchema.base(req.config('input.employee'))
  )

  const success = await dataAccessor(req).replace(idParam(req), doc)

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Updates authorization password. */
async function updateEmployeePassword(req, res) {
  /** @type {Required<Pick<Collection.Employee, "password">>} */
  const doc = joiValidate(
    req.body,
    employeeSchema.password(req.config('input.employee'))
  )

  doc.password = await hashPassword(doc.password, {
    hashSize: req.config('general.passwdHashSize')
  })

  const success = await dataAccessor(req).updatePassword(
    idParam(req),
    doc.password
  )

  if (!success) {
    throw createHttpError(404)
  } else {
    res.sendOk()
  }
}

module.exports = {
  createEmployee,
  deleteEmployee,
  listEmployees,
  readEmployee,
  updateEmployee,
  updateEmployeePassword
}
