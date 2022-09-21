// @ts-nocheck
'use strict'

/**
 * @typedef {import("joi").DateSchema} DateSchema
 * @typedef {DateSchema & { format: (format: "iso" | "javascript" | "unix" | "yyyy-mm-dd" | "yyyy-mm" | "yyyymmdd" | "yyyymm") => DateSchema }} ExtendedDateSchema
 */

/** @type {import("joi").ExtensionFactory} */
module.exports = joi => {
  const formatRegExp = /^(yyyymm(dd)?|yyyy-mm(-dd)?)$/
  const args = {
    format: joi.string().lowercase().pattern(formatRegExp)
  }

  return {
    base: joi.date(),
    type: 'date',

    coerce: function (value, { schema }) {
      const format = schema.$_getFlag('format')
      if (typeof value !== 'string' || !formatRegExp.test(format)) {
        return { value }
      } else if (
        new RegExp('^' + format.replaceAll(/\w/g, '\\d') + '$').test(value)
      ) {
        value = format.startsWith('yyyymm')
          ? value
              .replace(/^\d{4}/, match => match + '-')
              .replace(/\d{3}$/, match => match[0] + '-' + match.slice(1))
          : value
        return { value: new Date(value) }
      }
    },
    overrides: {
      format: function (format) {
        const { error } = args.format.validate(format)
        return error
          ? this.$_super.format(format)
          : this.$_setFlag('format', format)
      }
    }
  }
}
