'use strict'

const Joi = require('joi').extend(require('../../../../src/libs/joi/regex_schema_extension'))

test.each([/regex_expression/i, new RegExp('regex_class'), 'regex_raw_string', ['regex_raw_string_with_flags', 'i']])(
  'valid input, expect RegExp instance',
  value => {
    const result = Joi.regex().validate(value)
    expect(result.error).toBeUndefined()
    expect(result.value).toBeInstanceOf(RegExp)
  }
)

test.each([12345, '', '[\\w', [/regexp_expression/], ['regexp_raw_string', 'invalid_flag']])(
  'invalid input, expect ValidationError',
  value => {
    expect(Joi.regex().validate(value)).toMatchObject({ error: expect.anything() })
  }
)

test('array input format, expect correctly set RegExp flags', () => {
  const { error, value } = Joi.regex().validate(['regexp', 'g', 'i'])

  expect(error).toBeUndefined()
  expect(value).toBeInstanceOf(RegExp)
  expect(value.flags).toMatch(/[gi]+/)
})
