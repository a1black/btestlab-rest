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
function objectSetShallow(obj, prop, value) {
  if (value !== undefined && value !== null) {
    obj[prop] = value
  }
}

/**
 * Sets property in the object using provided path and value.
 *
 * @param {Dict<any>} obj Target object.
 * @param {Array<number | string> | number | string} path The path of the property to set.
 * @param {boolean | number | string} value The value to set.
 * @returns {void}
 */
function objectSet(obj, path, value) {
  const [prop, ...rest] =
    typeof path === 'string'
      ? path.split('.')
      : !Array.isArray(path)
      ? [path.toString()]
      : path

  if (!rest.length) {
    obj[prop] = value
    return
  } else if (!Object.hasOwn(obj, prop)) {
    obj[prop] = {}
  }

  return objectSet(obj[prop], rest, value)
}

module.exports = {
  capitalize,
  dateToShortISOString,
  objectSet,
  objectSetShallow
}
