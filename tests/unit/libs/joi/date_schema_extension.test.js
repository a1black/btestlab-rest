'use strict'

/** @type {import("joi").Root} */
const Joi = require('joi').extend(require('../../../../src/libs/joi/date_schema_extension'))

describe('format', () => {
  test.each(['iso', 'javascript', 'unix', 'yyyy-mm-dd', 'yyyy-mm', 'yyyymmdd', 'yyyymm'])(
    'valid format argument: %s, expect success',
    format => {
      // @ts-ignore
      expect(() => Joi.date().format(format)).not.toThrowError()
    }
  )

  test.each(['yyyy', 'yyyymm-dd', 'dd-mm-yyyy', 'ymd'])('invalid format argument, raises error', format => {
    // @ts-ignore
    expect(() => Joi.date().format(format)).toThrowError()
  })
})

describe('iso', () => {
  test('valid date format, expect success', () => {
    const test = new Date().toISOString()

    expect(Joi.date().iso().validate(test)).not.toMatchObject({ error: expect.anything() })
  })

  test('invalid date format, expect Error', () => {
    const test = new Date().toUTCString()

    expect(Joi.date().iso().validate(test)).toMatchObject({ error: expect.anything() })
  })
})

describe('javascript', () => {
  test('valid date format, expect success', () => {
    const test = Date.now().toString()

    // @ts-ignore
    expect(Joi.date().format('javascript').validate(test)).not.toMatchObject({
      error: expect.anything()
    })
  })

  test('invalid date format, expect Error', () => {
    const test = new Date().toISOString()

    // @ts-ignore
    expect(Joi.date().format('javascript').validate(test)).toMatchObject({ error: expect.anything() })
  })
})

describe('yyyy-mm-dd', () => {
  test.each([
    ['yyyy-mm-dd', '2022-09-19'],
    ['yyyy-mm', '2022-09']
  ])('valid date format %s, expect success', (format, value) => {
    // @ts-ignore
    expect(Joi.date().format(format).validate(value)).toMatchObject({ value: new Date(value) })
  })

  test.each([
    ['yyyy-mm-dd', '2022-09-1'],
    ['yyyy-mm-dd', '2022-09'],
    ['yyyy-mm', '2022-09-19']
  ])('invalid date format, expect error', (format, value) => {
    // @ts-ignore
    expect(Joi.date().format(format).validate(value)).toMatchObject({ error: expect.any(Error) })
  })
})

describe('yyyymmdd', () => {
  test.each([
    ['yyyymmdd', '20220919', '2022-09-19'],
    ['yyyymm', '202209', '2022-09-01']
  ])('valid date format %s, expect success', (format, value, expected) => {
    // @ts-ignore
    expect(Joi.date().format(format).validate(value)).toMatchObject({ value: new Date(expected) })
  })

  test.each([
    ['yyyymmdd', '202209010'],
    ['yyyymmdd', '202209'],
    ['yyyymm', '20220919']
  ])('invalid date format, expect error', (format, value) => {
    // @ts-ignore
    expect(Joi.date().format(format).validate(value)).toMatchObject({ error: expect.any(Error) })
  })
})
