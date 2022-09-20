'use strict'

/**
 * @typedef {string | string[]} Claim
 *
 * @typedef {import("express").Request} Request
 * @typedef {import("express").RequestHandler} RequestHandler
 */

const createHttpError = require('http-errors')

/**
 * @param {Request} req HTTP request object.
 * @returns {boolean} `true` if request was made with admin privileges, `false` otherwise.
 */
function adminCheck(req) {
  return req.user !== undefined && req.user.admin === true
}

/**
 *
 * @param {Record<string, (req: Request) => boolean>} assertMap Methods for verifying request privileges.
 * @param {Request} req HTTP request object.
 * @param {Claim} claim Privileges to check.
 * @returns {boolean} `true` if request has required privileges, `false` otherwise.
 */
function hashPrivilege(assertMap, req, claim) {
  claim = typeof claim === 'string' ? [claim] : claim

  return (
    claim.every(v => Object.hasOwn(assertMap, v)) &&
    claim.every(v => assertMap[v](req))
  )
}

/**
 * @param  {...[string, (req: Request) => boolean]} extensions Additional privilege verification methods.
 * @returns {{ attach: () => RequestHandler, verify: (...claims: Claim[]) => RequestHandler }}
 */
module.exports = (...extensions) => {
  /** @type {Record<string, (req: Request) => boolean>} */
  const assertMap = {}

  for (const [name, method] of extensions) {
    assertMap[name] = method
  }

  assertMap.admin = adminCheck

  return {
    attach: () => (req, res, next) => {
      req.claim = (...claims) =>
        false || claims.some(claim => hashPrivilege(assertMap, req, claim))
      next()
    },
    verify:
      (...claims) =>
      (req, res, next) => {
        const verified =
          false || claims.some(claim => hashPrivilege(assertMap, req, claim))
        next(verified ? undefined : createHttpError(403))
      }
  }
}
