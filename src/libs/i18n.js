'use strict'

const Polyglot = require('node-polyglot')
const fs = require('fs/promises')
const path = require('path')

/**
 * Loads translations into the memory.
 *
 * @param {{ defaultLocale: string }} options Initialization options.
 */
async function i18n(options) {
  const { defaultLocale } = options
  const /** @type {Dict<any>} */ locales = {}
  const localesDir = path.resolve(__dirname, '..', 'locales')
  const files = (await fs.readdir(localesDir)).filter(
    file => /^\w{2}/.test(file) && /\.json$/i.test(file)
  )

  for (const file of files) {
    locales[file.slice(0, 2).toLowerCase()] = await loadPhrases(
      localesDir,
      file
    )
  }

  /** @param {string} [locale] Locale code. */
  return locale => {
    const localeCode =
      locale && locale.length >= 2
        ? locale.slice(0, 2).toLowerCase()
        : defaultLocale

    /** @param {Polyglot.PolyglotOptions} [options] Initialization parameters. */
    return options =>
      translatorProvider(
        localeCode,
        Object.hasOwn(locales, localeCode)
          ? locales[localeCode]
          : Object.hasOwn(locales, defaultLocale)
          ? locales[defaultLocale]
          : {},
        options
      )
  }
}

/**
 * @param {string} dir An absolite path to a directory containing translation files.
 * @param {string} file Name of translation file.
 * @returns {Promise<Dict<any>>} Locale's name and an object with translated phrases.
 */
async function loadPhrases(dir, file) {
  try {
    const phrases = await fs
      .readFile(path.resolve(dir, file), 'utf-8')
      .then(JSON.parse)

    return phrases
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Fail to parse translation file '${file}' with error: ${error.message}`,
        { cause: error }
      )
    } else {
      throw error
    }
  }
}

/**
 * @param {string} locale Locale code.
 * @param {Dict<any>} phrases Object with translated phrases.
 * @param {Polyglot.PolyglotOptions} [options] Initialization options.
 * @returns {Polyglot} Text interpolation object.
 */
function translatorProvider(locale, phrases, options) {
  const polyglot = new Polyglot(
    Object.assign({ locale, allowMissing: true }, options ?? {})
  )
  polyglot.extend(phrases)

  return polyglot
}

module.exports = i18n
