'use strict'

/** @type {(code: string) => import("express").ErrorRequestHandler} Sets `serviceCode` property on raised error. */
module.exports = code => {
  return (err, req, res, next) => {
    if (err instanceof Error) {
      err.serviceCode = code
    }

    next(err)
  }
}
