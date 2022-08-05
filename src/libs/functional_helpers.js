'use strict'

/** @type {(value?: string) => typeof value} */
function capitalize(value) {
  return typeof value === 'string'
    ? value
        .toLowerCase()
        .replaceAll(/(?<=^|\P{L})\p{L}/gu, match => match.toUpperCase())
    : value
}

/** @type {(date?: Date) => string | undefined} Convert `Date` to 'YYYY-MM-DD' formated string. */
function dateToShortISOString(date) {
  return date?.toISOString().split('T')[0]
}

/** @type {(obj: Dict<any>, prop: string, value?: any) => void} Adds property to a target object if value is not Null. */
function objectSet(obj, prop, value) {
  if (value !== undefined && value !== null) {
    obj[prop] = value
  }
}

module.exports = {
  capitalize,
  dateToShortISOString,
  objectSet
}
