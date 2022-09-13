'use strict'

/**
 * @typedef {boolean | number | string | Number | String} Primitive
 * @typedef {Record<string, Primitive | Array<Primitive>>} SearchParams
 */

/**
 * @param {any} value Value to test.
 * @returns {value is Primitive} `true` if value is boolean, number or string primitive, `false` otherwise.
 */
function isPrimitive(value) {
  const type = typeof value

  return (
    type === 'boolean' ||
    type === 'number' ||
    type === 'string' ||
    value instanceof Boolean ||
    value instanceof Number ||
    value instanceof String
  )
}

/**
 * @param {SearchParams} searchParams Query parameters.
 * @yields {[string, string]} Parameter's name and value.
 */
function* searchParamsIterator(searchParams) {
  /** @type {(name: string, value: Array<Primitive>) => Iterable<[string, string]>} */
  function* iterArray(name, value) {
    for (const item of value) {
      if (isPrimitive(item)) {
        yield [name, item.toString()]
      }
    }
  }

  for (const [name, value] of Object.entries(searchParams)) {
    if (isPrimitive(value)) {
      yield [name, value.toString()]
    } else if (Array.isArray(value)) {
      yield* iterArray(name, value)
    }
  }
}

/**
 * Returns path and a query string suitable for use in a URL.
 *
 * @param {Primitive | Primitive[]} path Path component of an URL.
 * @param {SearchParams} [query] Query parameters.
 * @returns {string} Relative URL string.
 */
function urlpath(path, query) {
  if (Array.isArray(path)) {
    if (path.some(v => !isPrimitive(v))) {
      throw new TypeError('The "path" argument must be of type string.')
    }

    path = path.filter(isPrimitive).join('/')
  } else if (!isPrimitive(path)) {
    throw new TypeError('The "path" argument must be of type string.')
  } else {
    path = path.toString()
  }

  // Remove leading, trailing and repeating path-separetors
  path = path
    .replaceAll(/\/{2,}/g, '/')
    .replace(/^\//g, '')
    .replace(/\/$/, '')

  // Build query string
  const searchParams = new URLSearchParams()
  for (const [name, value] of searchParamsIterator(query ?? {})) {
    searchParams.append(name, value)
  }

  const queryString = searchParams.toString()
  const urlParts = []

  if (path.length || !queryString.length) {
    urlParts.push('/', path)
  }
  if (queryString.length) {
    urlParts.push('?', queryString)
  }

  return urlParts.join('')
}

module.exports = urlpath
