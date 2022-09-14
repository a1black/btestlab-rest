'use strict'

const createHttpError = require('http-errors')

const createAuthError = require('./errors')
const objectSet = require('../../../libs/objectset')

/**
 * @param {I18nFactoryFunction} provider Function to spawn interpolation object.
 * @returns {ReturnType<I18nFactoryFunction>["t"]}
 */
function i18nHelper(provider) {
  // @ts-ignore
  const i18n = provider({ allowMissing: true, onMissingKey: () => undefined })

  return (phrase, options) =>
    i18n.t('error.auth.' + phrase, options) ??
    i18n.t('error.invalid', options) ??
    'invalid'
}

/** @type {import("express").ErrorRequestHandler} */
module.exports = (err, req, res, next) => {
  if (!createAuthError.isAuthError(err)) {
    return next(err)
  }

  const response = {}
  if (err.credentials.length) {
    const i18n = i18nHelper(req.i18n)

    for (const key of err.credentials) {
      objectSet(response, 'errors.' + key, i18n(key))
    }
  }

  next(createHttpError(400, err.message, { response }))
}
