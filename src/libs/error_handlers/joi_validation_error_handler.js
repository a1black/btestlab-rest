'use strict'

/** @typedef {import("node-polyglot").InterpolationOptions} InterpolationOptions */

const Joi = require('joi')
const createHttpError = require('http-errors')

const { dateToShortISOString, objectSet } = require('../functional_helpers')

/**
 * @param {I18nFactoryFunction} provider Function to spawn interpolation object.
 */
function i18nHelper(provider) {
  // @ts-ignore
  const i18n = provider({ allowMissing: true, onMissingKey: () => undefined })

  /**
   * @param {InterpolationOptions} options Interpolation options.
   * @param {Array<number | string | Array<number | string> | undefined>} path Path to a key phrase.
   * @returns {string | undefined} Translation if found, `undefined` otherwise.
   */
  return (options, ...path) => {
    const dotPath = path
      .flat(1)
      .filter(v => v !== undefined && v !== 'null')
      .join('.')

    return dotPath ? i18n.t(dotPath, options) : undefined
  }
}

/**
 * Returns method for copying validation parameters to interpolation options.
 *
 * @returns {(context: Joi.Context, intl: Dict<any>) => Dict<any>}
 */
function intlOptionsPopulationChain() {
  /** @type {Array<((intl: Dict<any>, context: Joi.Context) => any) | string>} */
  const chain = [
    // Number of missing elements in an array
    'unknownMisses',
    // Stringify list of allowed values
    (intl, context) =>
      Array.isArray(context.valids) &&
      objectSet(intl, 'valids', context.valids.join(', ')),
    // Stringify list of disallowed values
    (intl, context) =>
      Array.isArray(context.invalids) &&
      objectSet(intl, 'invalids', context.invalids.join(', ')),
    // Limitation set on a value
    (intl, context) => {
      const { limit } = context
      if (typeof limit === 'number') {
        intl.limit = limit
        intl.smart_count = limit
      } else if (limit instanceof Date) {
        intl.limit = dateToShortISOString(limit)
      } else {
        intl.limit = limit
      }
    }
  ]

  return (context, intl) => {
    for (const link of chain) {
      if (typeof link === 'string') {
        Object.hasOwn(context, link) && objectSet(intl, link, context[link])
      } else {
        link(intl, context)
      }
    }

    return intl
  }
}

/**
 * @param {Joi.ValidationError["details"]} errors List of validation errors.
 * @param {{ i18n: any, service?: string }} options Interpolation provider and service which raised the error.
 * @returns {Dict<any>} Translated error messages shaped base on user's input.
 */
function processErrorMessages(errors, { i18n, service }) {
  /** @type {ReturnType<i18nHelper>} Lookup translation in list of Joi errors. */
  const joiI18n = (options, ...path) => i18n(options, 'joi', ...path)
  /** @type {ReturnType<i18nHelper>} Lookup translation in list of generic error messages. */
  const errorI18n = (options, ...path) => i18n(options, 'error', ...path)
  /** @type {Dict<any>} Translated validation errors. */
  const errorMessages = {}
  const intlProducer = intlOptionsPopulationChain()

  for (const error of errors) {
    const { context = {}, type } = error
    const path = error.path.slice()

    // Modify error stack or error information
    if (type === 'any.ref') {
      // Skip errors because of failed validation of depended key.
      continue
    } else if (type === 'object.with' && typeof context.peer === 'string') {
      // Replace error on object field with error on required child field
      errors.push({
        message: 'any.required',
        context: { key: context.peer },
        path: path.concat([context.peer]),
        type: 'any.required'
      })
      continue
    } else if (type === 'object.missing' && Array.isArray(context.peers)) {
      // Replace error on object field with error on missing child fields which were specified in `or` rule
      for (const peer of context.peers) {
        errors.push({
          message: 'any.missing',
          context: { key: peer },
          path: path.concat([peer]),
          type: 'any.missing'
        })
      }
      continue
    } else if (type === 'array.sparse') {
      // Remove index of `null` element in validated array
      path.pop()
    }

    /** @type {InterpolationOptions} Translation options. */
    const intlOps = intlProducer(context, {})
    // Try to translate date format and relative time string (like `now`)
    if (type.startsWith('date.')) {
      const { format, limit } = context
      typeof format === 'string' &&
        objectSet(
          intlOps,
          'format',
          joiI18n({ _: format }, 'date._vars', format)
        )
      typeof limit === 'string' &&
        objectSet(intlOps, 'limit', joiI18n({ _: limit }, 'date._vars', limit))
    }
    // Limit is path to a reference field, so try to translate field name
    if (Array.isArray(context.limit?.path)) {
      intlOps.limit = errorI18n(
        { _: context.limit.path.join('.') },
        '_limits',
        context.limit.path
      )
    }

    const message =
      joiI18n(intlOps, type) ??
      errorI18n(intlOps, service, path) ??
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
