'use strict'

/**
 * @param {Date|'now'} [date] Date to process or current time if not provided.
 * @returns {Date} Date with time set to '00:00:00.000'.
 */
function dateUnsetTime(date) {
  const timestamp = !date || date === 'now' ? Date.now() : date.getTime()

  return new Date(timestamp - (timestamp % (24 * 3600 * 1000)))
}

/**
 * Prepares document to be served by HTTP service.
 * @param {Partial<Collection.Contingent>} doc Instance of a contingent document.
 * @returns {any} Formatted plain object.
 */
function formatContingentDoc(doc) {
  return responseObjectSetter({}, [
    ['id', doc.code],
    ['desc', doc.desc],
    ['created', doc.ctime?.getTime()],
    ['deleted', doc.dtime?.getTime()]
  ])
}

/**
 * @param {any} value Value to test.
 * @returns {boolean} Returns `true` if value considered to be `null` by response recipient.
 */
function isNone(value) {
  return (
    value === null ||
    value === undefined ||
    value === false ||
    (typeof value === 'string' && /^\s*$/.test(value))
  )
}

/**
 * @param {Dict<any>} obj Dictionary populated with response data.
 * @param {string|Array<[string, any?]>} property Dictionary key or list of [key, value] to assign to `obj`.
 * @param {any} [value] Value added to the `obj`.
 * @returns {Dict<any>}
 */
function responseObjectSetter(obj, property, value) {
  if (Array.isArray(property)) {
    for (const keyValue of property) {
      responseObjectSetter(obj, ...keyValue)
    }
  } else if (!isNone(value)) {
    obj[property] = value
  }

  return obj
}

module.exports = { dateUnsetTime, formatContingentDoc }
