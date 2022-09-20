'use strict'

/**
 * @typedef {Object} JoiErrorProps
 * @property {any} context Error Validation rule parameters.
 * @property {Array<number | string>} path Path to property.
 * @property {string} type Validation rule name
 */

const Joi = require('joi')

const joiErrorHandler = require('../../../../src/libs/error_handlers/joi_validation_error_handler')

const errorHandler = (options => joiErrorHandler(options))({})
const mockT = () => jest.fn((_, options) => options?._)
/** @type {(t: any) => any} */
const stabReq = t => ({ i18n: () => ({ t }) })
/** @type {() => any} */
const stabRes = () => null

/**
 * @param {Function} t Mock translation function.
 * @param {any} intlOps Expected interpolation options.
 * @param {{ error?: Joi.ValidationError, path?: any[], type?: string, shift?: number }} options Assertion options.
 */
function i18nCallStackFixture(t, intlOps, options) {
  /** @type {(...path: any[]) => string} */
  const join = (...path) => path.flat(1).join('.')

  const { error, shift = 0 } = options ?? {}
  const path = options?.path ?? error?.details[0].path
  const type = options?.type ?? error?.details[0].type

  expect(t).toHaveBeenNthCalledWith(1 + shift, join('joi', type), expect.objectContaining(intlOps))
  expect(t).toHaveBeenNthCalledWith(2 + shift, join('error', path), expect.objectContaining(intlOps))
  expect(t).toHaveBeenNthCalledWith(3 + shift, 'error.invalid', expect.anything())
}

/**
 * @param {Function} next Next request handler mock function.
 * @param {{ error?: Joi.ValidationError, path?: any[]}} options Assertion options.
 */
function nextCallFixture(next, options) {
  const path = options.path ?? options.error?.details[0].path ?? []
  const errors = path.reverse().reduce((errors, link) => {
    errors = errors ? { [link]: errors } : { [link]: expect.any(String) }
    return errors
  }, null)

  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.any(String),
      status: 400,
      response: { errors }
    })
  )
}

describe('array validation error', () => {
  test('null element in an array', () => {
    const next = jest.fn()
    const t = mockT()
    const path = ['test']
    const { error } = Joi.object({
      test: Joi.array().items(Joi.any())
    }).validate({ test: [undefined] })

    expect(error).not.toBeUndefined()

    errorHandler(error, stabReq(t), stabRes(), next)

    i18nCallStackFixture(t, {}, { error, path })
    nextCallFixture(next, { path })
  })

  test('invalid item', () => {
    const next = jest.fn()
    const t = mockT()
    const path = ['test', 0]
    const { error } = Joi.object({
      test: Joi.array().items(Joi.number())
    }).validate({ test: ['string', 'string'] })

    expect(error).not.toBeUndefined()

    errorHandler(error, stabReq(t), stabRes(), next)

    i18nCallStackFixture(t, {}, { error, path })
    nextCallFixture(next, { path })
  })
})

describe('date validation error', () => {
  test('date limit is "now" string', () => {
    const next = jest.fn()
    const t = mockT()
    const { error } = Joi.object({
      test: Joi.date().min('now')
    }).validate({ test: new Date('1970-01-01') })

    errorHandler(error, stabReq(t), stabRes(), next)

    expect(t).toHaveBeenNthCalledWith(1, 'joi.date._vars.now', expect.anything())
    i18nCallStackFixture(t, { limit: expect.any(String) }, { error, shift: 1 })
    nextCallFixture(next, { error })
  })

  test('invalid format error', () => {
    const next = jest.fn()
    const t = mockT()
    const { error } = Joi.object({
      test: Joi.date().iso()
    }).validate({ test: '2000.01.02' })

    errorHandler(error, stabReq(t), stabRes(), next)

    expect(t).toHaveBeenNthCalledWith(1, 'joi.date._vars.iso', expect.anything())
    i18nCallStackFixture(t, { format: expect.any(String) }, { error, shift: 1 })
    nextCallFixture(next, { error })
  })
})

describe('invalid & valid rules validation error', () => {
  test('invalid rule', () => {
    const next = jest.fn()
    const t = mockT()
    const { error } = Joi.object({
      test: Joi.number().invalid(1, 2, 3)
    }).validate({ test: 1 })

    expect(error).not.toBeUndefined()

    errorHandler(error, stabReq(t), stabRes(), next)

    i18nCallStackFixture(t, { invalids: '1, 2, 3' }, { error })
    nextCallFixture(next, { error })
  })

  test('valid rule', () => {
    const next = jest.fn()
    const t = mockT()
    const { error } = Joi.object({
      test: Joi.number().valid(1, 2, 3)
    }).validate({ test: 0 })

    expect(error).not.toBeUndefined()

    errorHandler(error, stabReq(t), stabRes(), next)

    i18nCallStackFixture(t, { valids: '1, 2, 3' }, { error })
    nextCallFixture(next, { error })
  })
})

describe('limit rule validation error', () => {
  test('limit is Date object', () => {
    const next = jest.fn()
    const t = mockT()
    const { error } = Joi.object({
      test: Joi.date().max(new Date('2000-01-01'))
    }).validate({ test: new Date('2000-01-02') })

    expect(error).not.toBeUndefined()

    errorHandler(error, stabReq(t), stabRes(), next)

    i18nCallStackFixture(t, { limit: expect.any(String) }, { error })
    nextCallFixture(next, { error })
  })

  test('limit is number', () => {
    const next = jest.fn()
    const t = mockT()
    const limit = 1
    const { error } = Joi.object({
      test: Joi.number().max(limit)
    }).validate({ test: limit + 1 })

    expect(error).not.toBeUndefined()

    errorHandler(error, stabReq(t), stabRes(), next)

    i18nCallStackFixture(t, { limit, smart_count: limit }, { error })
    nextCallFixture(next, { error })
  })

  test('limit is a reference', () => {
    const next = jest.fn()
    const t = mockT()
    const { error } = Joi.object({
      ref: Joi.date(),
      test: Joi.date().max(Joi.ref('ref'))
    }).validate({ ref: '2000-01-01', test: '2000-01-02' })

    expect(error).not.toBeUndefined()

    errorHandler(error, stabReq(t), stabRes(), next)

    expect(t).toHaveBeenNthCalledWith(1, 'error._limits.ref', expect.anything())
    i18nCallStackFixture(t, { limit: expect.any(String) }, { error, shift: 1 })
    nextCallFixture(next, { error })
  })
})

describe('object validation error', () => {
  test('with rule', () => {
    const next = jest.fn()
    const t = mockT()
    const path = ['obj', 'peer']
    const { error } = Joi.object({
      obj: Joi.object({
        peer: Joi.any(),
        test: Joi.any()
      }).with('test', 'peer')
    }).validate({ obj: { test: true } })

    expect(error).not.toBeUndefined()

    errorHandler(error, stabReq(t), stabRes(), next)

    i18nCallStackFixture(t, {}, { path, type: 'any.required' })
    nextCallFixture(next, { path })
  })

  test('or rule', () => {
    const next = jest.fn()
    const t = mockT()
    const { error } = Joi.object({
      obj: Joi.object({
        peerOne: Joi.any(),
        peerTwo: Joi.any()
      }).or('peerOne', 'peerTwo')
    }).validate({ obj: {} })

    expect(error).not.toBeUndefined()

    errorHandler(error, stabReq(t), stabRes(), next)

    expect(t).toHaveBeenNthCalledWith(1, 'joi.any.missing', expect.anything())
    expect(t).toHaveBeenNthCalledWith(2, expect.stringMatching(/^error\.obj\.peer/), expect.anything())
    expect(t).toHaveBeenNthCalledWith(3, 'error.invalid', expect.anything())
    expect(t).toHaveBeenNthCalledWith(4, 'joi.any.missing', expect.anything())
    expect(t).toHaveBeenNthCalledWith(5, expect.stringMatching(/^error\.obj\.peer/), expect.anything())
    expect(t).toHaveBeenNthCalledWith(6, 'error.invalid', expect.anything())

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
        status: 400,
        response: {
          errors: {
            obj: expect.objectContaining({
              peerOne: expect.any(String),
              peerTwo: expect.any(String)
            })
          }
        }
      })
    )
  })
})
