'use strict'

/** @type {import("joi").ExtensionFactory} */
module.exports = joi => ({
  type: 'regex',
  base: joi.any(),
  messages: {
    'regex.base': '{{#label}} must be regex string or a tuple [regex, flags]',
    'regex.empty': '{{#label}} is not allowed to be empty',
    'regex.flags': '{{#label}} contains invalid RegExp flags',
    'regex.invalid': '{{#label}} must be valid regular expression'
  },
  /** @param {string | [string, string?]} value */
  validate(value, { error }) {
    try {
      value = typeof value === 'string' ? [value] : value
      if (value instanceof RegExp) {
        return { value }
      } else if (
        !Array.isArray(value) ||
        value.some(v => typeof v !== 'string')
      ) {
        return { errors: error('regex.base') }
      } else if (value[0].trim() === '') {
        return { errors: error('regex.empty') }
      } else {
        const [base, ...flags] = value

        return { value: new RegExp(base, flags.join('')) }
      }
    } catch (err) {
      return {
        errors: error(
          // @ts-ignore
          /invalid flag/i.test(err.messages) ? 'regex.flags' : 'regex.invalid'
        )
      }
    }
  }
})
