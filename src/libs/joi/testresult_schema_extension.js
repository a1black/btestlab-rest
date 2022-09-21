'use strict'

const { TestPositiveEnum } = require('../../globals')

/** @type {import("joi").ExtensionFactory} */
module.exports = joi => ({
  type: 'test',
  base: joi.any(),
  messages: {
    'test.empty': '{{#label}} is not allowed to be empty',
    'test.positive':
      '{{#label}} must be either positive, negative or indetermined'
  },
  validate(value, { error }) {
    if (typeof value === 'string' && value === '') {
      return { value, errors: error('test.empty') }
    }

    return { value }
  },
  rules: {
    positive: {
      convert: true,
      method() {
        return this.$_addRule('positive')
      },
      validate(value, { error }) {
        const result = joi
          .number()
          .integer()
          .valid(...TestPositiveEnum)
          .validate(value, { convert: true, errors: { render: false } })

        return result.error ? error('test.positive') : result.value
      }
    }
  }
})
