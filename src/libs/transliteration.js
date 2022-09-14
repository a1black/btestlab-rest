'use strict'

/**
 * @typedef {(reader: TransliterationLink) => string} TransliterationFunc
 * @typedef {Record<string, string | TransliterationFunc>} TransliterationMapping
 */

/** @type {TransliterationLink[]} */
const LOOKUP_STACK = []

/** @type {Record<string, TransliterationMapping>} */
// prettier-ignore
const MAP = {
  ru: {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shh', 'ъ':'', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',

    'ц': reader => /^[ieyj]/i.test(reader?.next()?.translit ?? '') ? 'c' : 'cz'
  }
}

/**
 * Capitalizes first letter.
 *
 * @param {string} value Input string.
 * @returns {string} Capitalized string.
 */
function capitalize(value) {
  return value.replace(/\p{L}/u, match => match.toUpperCase())
}

/**
 * @param {TransliterationFunc} callback Function to convert letter to Latin.
 * @param {TransliterationLink} link Character to convert.
 * @returns {any}
 */
function loopsafe(callback, link) {
  let result
  if (!LOOKUP_STACK.includes(link)) {
    LOOKUP_STACK.push(link)
    result = callback(link)
    LOOKUP_STACK.pop()
  } else {
    result = undefined
  }

  return result
}

/**
 * Produces function for converting letters of provided alphabet to Latin.
 *
 * @param {TransliterationMapping} mapping Letter mapping.
 * @returns {TransliterationFunc} Transliteration function.
 */
function transliterationFactory(mapping) {
  return reader => {
    const rule = mapping[reader.source.toLowerCase()]

    return typeof rule === 'string'
      ? rule
      : typeof rule === 'function'
      ? loopsafe(rule, reader)
      : reader.source
  }
}

/**
 * Returns function that extends character sequence to the right.
 *
 * @param {TransliterationLink} current Next character in the sequence.
 * @returns {(link: TransliterationLink | string, translate?: TransliterationFunc) => void}
 */
function transliterationWriter(current) {
  return (link, translate) => {
    if (typeof link === 'string' && translate) {
      link = new TransliterationLink(link, translate)
    } else if (typeof link === 'string') {
      throw new Error('Translate function not defined')
    }

    if (current) {
      link.setPrev(current)
      current.setNext(link)
    }

    current = link
  }
}

class TransliterationLink {
  /**
   * @param {string} source Character to convert.
   * @param {TransliterationFunc} translate Transliteration function.
   * @param {{ next?: TransliterationLink, prev?: TransliterationLink }} [links] Pointers to the next and the previous characters in the text.
   */
  constructor(source, translate, links) {
    /** @type {TransliterationLink | undefined} */
    this._next = undefined
    /** @type {TransliterationLink | undefined} */
    this._prev = undefined
    /** @type {string} */
    this._source = source.toLowerCase()
    /** @type {boolean} `true` for upper case, `false` otherwise. */
    this._case = this._source !== source
    /** @type {TransliterationFunc} */
    this._translate = translate
    /** @type {string | undefined} */
    this._translit = undefined

    this.setNext(links?.next)
    this.setPrev(links?.prev)
  }

  _convert() {
    return this._translate(this)
  }

  get source() {
    return this._case ? this._source.toUpperCase() : this._source
  }

  get translit() {
    if (this._translit === undefined) {
      this._translit = this._convert()
    }

    return this._case ? capitalize(this._translit) : this._translit
  }

  next() {
    return this._next
  }

  prev() {
    return this._prev
  }

  /**
   * @param {TransliterationLink | undefined} link Next character in the sequence.
   */
  setNext(link) {
    this._next = link
  }

  /**
   * @param {TransliterationLink | undefined} link Next character in the sequence.
   */
  setPrev(link) {
    this._prev = link
  }
}

/**
 * Converts Russian letters into corresponding Latin letters using Gost 7.79-2000.
 *
 * Method uses modified Gost standard that can be used without url encoding.
 *
 * @param {string} phrase Text to convert to Latin characters.
 * @param {string} [locale="ru"] Locale code.
 * @returns {string}
 */
module.exports = (phrase, locale) => {
  if (!phrase.length) {
    return phrase
  }

  locale = typeof locale === 'string' ? locale.toLowerCase().slice(0, 2) : 'ru'
  const translate = transliterationFactory(
    Object.hasOwn(MAP, locale) ? MAP[locale] : MAP.ru
  )

  const sequence = new TransliterationLink(phrase[0], translate)
  const writer = transliterationWriter(sequence)
  for (let i = 1; i < phrase.length; i++) {
    writer(phrase[i], translate)
  }

  let /** @type {TransliterationLink | undefined} */ ref = sequence
  const result = []
  while (ref) {
    result.push(ref.translit)
    ref = ref.next()
  }

  return result.join('')
}
