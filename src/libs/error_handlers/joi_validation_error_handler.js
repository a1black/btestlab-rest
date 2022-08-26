'use strict'

/** @typedef {import("node-polyglot").InterpolationOptions} InterpolationOptions */

const Joi = require('joi')
const createHttpError = require('http-errors')

const { dateToShortISOString, objectSet } = require('../functional_helpers')

/** @type {(sep?: string, ...value: any[]) => string} */
function arrToStr(sep = '.', ...value) {
  return value
    .flat(1)
    .filter(v => !(v === null || v === undefined))
    .map(v => v.toString())
    .join(sep)
}

/**
 * @param {I18nFactoryFunction} provider Function to spawn interpolation object.
 */
function i18nHelper(provider) {
  // @ts-ignore
  const i18n = provider({ allowMissing: true, onMissingKey: () => undefined })

  /**
   * @param {InterpolationOptions} options Interpolation options.
   * @param {any[]} path Error phrase or a path string.
   * @returns {string | undefined} Translated message.
   */
  return (options, ...path) => {
    return i18n.t(arrToStr('.', ...path), options)
  }
}

/**
 * @param {Joi.ValidationError["details"]} errors List of validation errors.
 * @param {{ i18n: any, service?: string }} intlProvider Interpolation provider.
 * @returns {Dict<any>} Translated error messages shaped base on user's input.
 */
function processErrorMessages(errors, { i18n, service }) {
  /** @type {ReturnType<i18nHelper>} */
  const joiI18n = (options, ...path) => i18n(options, 'joi', ...path)
  /** @type {ReturnType<i18nHelper>} */
  const errorI18n = (options, ...path) => i18n(options, 'error', ...path)

  const /** @type {Dict<any>} */ errorMessages = {}

  for (const error of errors) {
    const /** @type {InterpolationOptions} */ intrParams = {}
    const { context = {}, type } = error
    const path = error.path.slice()

    if (type === 'any.ref') {
      // Skip error by association
      continue
    } else if (type === 'object.with' && typeof context.peer === 'string') {
      errors.push({
        message: 'any.required',
        context: { key: context.peer },
        path: path.concat([context.peer]),
        type: 'any.required'
      })
      // Skip aggregated error
      continue
    } else if (type === 'any.invalid') {
      intrParams.invalids = arrToStr(', ', context.invalids)
    } else if (type === 'any.only') {
      intrParams.valids = arrToStr(', ', context.valids)
    } else if (type === 'date.format' && typeof context.format === 'string') {
      intrParams.format = joiI18n(
        { _: context.format },
        'date._vars',
        context.format
      )
    } else if (type === 'array.sparse') {
      // Remove index of `null` element in the validated array.
      path.pop()
    }

    if (typeof context.limit === 'string' && type.startsWith('date.')) {
      // Limit is date string `now`
      intrParams.limit = joiI18n(
        { _: context.limit },
        'date._vars',
        context.limit
      )
    } else if (typeof context.limit === 'number') {
      intrParams.limit = context.limit
      intrParams.smart_count = context.limit
    } else if (context.limit instanceof Date) {
      intrParams.limit = dateToShortISOString(context.limit)
    } else if (Array.isArray(context.limit?.path)) {
      // Limit rule is a reference to another field, limit value is path
      intrParams.limit = errorI18n(
        { _: context.limit.path.join('.') },
        '_vars',
        ...context.limit.path
      )
    }

    const message =
      joiI18n(intrParams, type) ??
      errorI18n(intrParams, service, path) ??
      errorI18n({}, 'invalid') ??
      'invalid'

    objectSet(errorMessages, path, message)
  }

  return errorMessages
}

/** @type {import("express").ErrorRequestHandler} Processes errors raised by Joi validation schema. */
module.exports = (err, req, res, next) => {
  if (!Joi.isError(err)) {
    next(err)
  } else {
    next(
      createHttpError(400, 'Document Failed Validation', {
        response: Object.assign(err.response ?? {}, {
          errors: processErrorMessages(err.details ?? [], {
            i18n: i18nHelper(req.i18n),
            service: err.serviceCode
          })
        })
      })
    )
  }
}
