'use strict'

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").RequestHandler} RequestHandler
 */

const createHttpError = require('http-errors')
const { attempt: joiValidate } = require('joi')

const employeeDataAccessor = require('./lib/employee_data_accessor')
const employeeSchema = require('./lib/employee_schema')
const jwt = require('../../libs/accesstoken')
const {
  formatEmployeeDoc,
  hashPassword,
  linkEmployeeDoc
} = require('./lib/employee_helper_functions')

/**
 * @param {Request} req Client HTTP request.
 */
function dataAccessor(req) {
  return employeeDataAccessor(req.context.db, req.config('genops.employeeId'))
}

/**
 * @param {Request} req Client HTTP request.
 * @returns {Collection.Employee["_id"]} Document identifier passed in URL.
 */
function idparam(req) {
  // @ts-ignore
  return req.params.id
}

/** @type {RequestHandler} Creates new employee document. */
async function createEmployee(req, res) {
  /** @type {Collection.OmitBase<Collection.Employee, "admin">} */
  const input = joiValidate(
    req.body ?? {},
    employeeSchema.employeeDoc(req.config('input.employee'))
  )

  if (input.password) {
    input.password = await hashPassword(input.password, {
      hashSize: req.config('general.passwdHashSize')
    })
  }

  // @ts-ignore
  const id = await dataAccessor(req).create(input)

  res.json({
    links: linkEmployeeDoc(req, { _id: id })
  })
}

/** @type {RequestHandler} Removes employee document. */
async function deleteEmployee(req, res) {
  const success = await dataAccessor(req).remove(idparam(req))

  if (!success) {
    throw createHttpError(404)
  } else if (req.claim('owner')) {
    res.json({ accessToken: false })
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Returns list of employee documents. */
async function listEmployees(req, res) {
  const list = []
  for await (const doc of dataAccessor(req).list()) {
    list.push(formatEmployeeDoc(doc))
  }

  res.json({
    links: linkEmployeeDoc(req),
    list
  })
}

/** @type {RequestHandler} Returns employee document. */
async function readEmployee(req, res) {
  const doc = await dataAccessor(req).read(idparam(req))

  if (!doc) {
    throw createHttpError(404)
  } else {
    res.json({
      doc: formatEmployeeDoc(doc),
      links: linkEmployeeDoc(req, doc),
      owner: req.claim('owner')
    })
  }
}

/** @type {RequestHandler} Replaces employee document with modified version. */
async function updateEmployee(req, res) {
  /** @type {Collection.OmitBase<Collection.Employee, "admin" | "password">} */
  const input = joiValidate(
    req.body ?? {},
    employeeSchema.updateDoc(req.config('input.employee'))
  )

  const success = await dataAccessor(req).replace(idparam(req), input)

  if (!success) {
    throw createHttpError(404)
  } else if (req.claim('owner')) {
    res.json({ accessToken: jwt(req.user, req.config('accessToken')) })
  } else {
    res.sendOk()
  }
}

/** @type {RequestHandler} Updates employee's password. */
async function updateEmployeePassword(req, res) {
  /** @type {Required<Pick<Collection.Employee, "password">>} */
  const input = joiValidate(
    req.body ?? {},
    employeeSchema.passwordDoc(req.config('input.employee'))
  )

  const password = await hashPassword(input.password, {
    hashSize: req.config('general.passwdHashSize')
  })

  const success = await dataAccessor(req).updatePassword(idparam(req), password)

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
