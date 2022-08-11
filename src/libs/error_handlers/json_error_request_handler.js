'use strict'

const createHttpError = require('http-errors')

/** @type {import("express").ErrorRequestHandler} Replacement for express default error handler. */
module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  let /** @type {string} */ message
  let /** @type {number} */ status

  if (createHttpError.isHttpError(err)) {
    status = err.status
    message = err.message
  } else if (err instanceof Error) {
    status = err.status ?? err.statusCode ?? 500
    message =
      err.expose === true || status < 500
        ? err.message
        : createHttpError(status).message

    if (!err.status && !err.statusCode) {
      req.logger.fatal(err)
    } else if (status >= 500) {
      req.logger.error(err)
    }
  } else {
    status = 500
    message = 'Internal Server Error'
  }

  if (status === 401) {
    res.setHeader('WWW-Authenticate', 'Bearer')
  }

  /** @type {Dict<any>} */
  const responseBody = err instanceof Error && err.response ? err.response : {}
  responseBody.message = req.i18n().t(message)

  res.status(status).json(responseBody)
}
