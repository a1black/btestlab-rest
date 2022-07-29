'use strict'

const dotenv = require('dotenv')
const fs = require('fs/promises')
const path = require('path')

/** @type {import('joi')} */
const Joi = require('joi').extend(joi => ({
  type: 'regex',
  base: joi.any(),
  messages: {
    'regex.base': '{{#label}} must be regex string or a tuple [regex, flags]',
    'regex.empty': '{{#label}} is not allowed to be empty',
    'regex.invalid': '{{#label}} must be valid regular expression'
  },
  /** @param {string|[string, string?]} value */
  validate(value, { error }) {
    try {
      value = typeof value === 'string' ? [value] : value
      if (!Array.isArray(value) || value.some(v => typeof v !== 'string')) {
        return { errors: error('regex.base') }
      } else if (value[0].trim() === '') {
        return { errors: error('regex.empty') }
      } else {
        return { value: new RegExp(...value) }
      }
    } catch (err) {
      return { errors: error('regex.invalid') }
    }
  }
}))

const DB_SCHEMA = Joi.object({
  dbname: Joi.string(),
  uri: Joi.string().uri({ scheme: 'mongodb' })
})
const GENERAL_SCHEMA = Joi.object({
  // @ts-ignore
  employeeNameCapitalize: Joi.regex(),
  passwdHashSize: Joi.number().positive().min(32)
})
const GENOPS_SCHEMA = Joi.object({
  employee: Joi.object({
    codeLength: Joi.number().positive().min(4).max(10),
    codePrefix: Joi.number().positive()
  })
})
const JWT_SCHEMA = Joi.object({
  adminKey: Joi.string(),
  algorithm: Joi.string(),
  issuer: Joi.string().uri(),
  secret: Joi.string().base64(),
  ttl: Joi.number().integer().positive()
})
const SERVER_SCHEMA = Joi.object({
  env: Joi.string(),
  host: Joi.string().ip({ cidr: 'forbidden' }),
  port: Joi.number().port(),
  logLevel: Joi.string().empty('').allow('error', 'warn', 'info', 'debug')
})

/** @type {() => Promise<string|undefined>} */
const readJwtKey = () =>
  fs
    .readFile(path.resolve(__dirname, '..', '..', 'private', 'JWT_SECRET.key'))
    .then(data => data.toString('utf8'))
    .catch(() => undefined)
/** @type {(value: Dict, schema: import('joi').ObjectSchema) => Dict} */
const validateSection = (value, schema) =>
  Joi.attempt(value, schema, { abortEarly: false, allowUnknown: true })
/** @type {(value: Dict) => Dict} */
const validateDb = value => validateSection(value, DB_SCHEMA)
/** @type {(value: Dict) => Dict} */
const validateGeneral = value => validateSection(value, GENERAL_SCHEMA)
/** @type {(value: Dict) => Dict} */
const validateGenops = value => validateSection(value, GENOPS_SCHEMA)
/** @type {(value: Dict) => Dict} */
const validateJwt = value => validateSection(value, JWT_SCHEMA)
/** @type {(value: Dict) => Dict} */
const validateServer = value => validateSection(value, SERVER_SCHEMA)

/**
 * @returns {Promise<Dict>} Validated configuration object.
 */
async function loadApplicationConfig() {
  try {
    const config = await fs
      .readFile(path.resolve(__dirname, 'appconfig.json'), 'utf8')
      .then(JSON.parse)
    const jwtSecret = await readJwtKey()
    const schema = Joi.object({
      accessToken: JWT_SCHEMA.prefs({ presence: 'required' }),
      db: DB_SCHEMA.prefs({ presence: 'required' }),
      general: GENERAL_SCHEMA.prefs({ presence: 'required' }),
      genops: GENOPS_SCHEMA.prefs({ presence: 'required' }),
      server: SERVER_SCHEMA
    })

    return Joi.attempt(
      {
        accessToken: Object.assign(
          validateJwt(config.accessToken),
          validateJwt({ secret: jwtSecret })
        ),
        db: Object.assign(
          validateDb(config.db),
          validateDb({ uri: process.env.MONGODB_URI })
        ),
        general: validateGeneral(config.general),
        genops: validateGenops(config.genops),
        server: Object.assign(
          validateServer(config.server ?? {}),
          validateServer({
            env: process.env.NODE_ENV,
            host: process.env.SERVER_HOST,
            port: process.env.SERVER_PORT,
            logLevel: process.env.LOG_LEVEL
          })
        )
      },
      schema,
      { abortEarly: false, allowUnknown: true }
    )
  } catch (err) {
    // @ts-ignore
    throw new Error('Invalid application configuration', { cause: err })
  }
}

/**
 * @returns {Promise<Dict>} User input validation options.
 */
async function loadInputValidationConfig() {
  try {
    const config = await fs
      .readFile(path.resolve(__dirname, 'inputconfig.json'), 'utf8')
      .then(JSON.parse)

    return Joi.attempt(
      config,
      Joi.object({
        contingent: Joi.object({
          code: Joi.object({ pattern: Joi.regex().required() })
        }),
        employee: Joi.object({
          name: Joi.object({
            // @ts-ignore
            pattern: Joi.regex().required()
          }),
          password: Joi.object({
            // @ts-ignore
            pattern: Joi.regex().required()
          })
        })
      }),
      { abortEarly: false, allowUnknown: true }
    )
  } catch (err) {
    // @ts-ignore
    throw new Error('Invalid input validation configuration', { cause: err })
  }
}

/**
 * @returns {Promise<Configuration>} Complete application configuration object.
 */
async function load() {
  const appconfig = await loadApplicationConfig()
  const inputconfig = await loadInputValidationConfig()

  return {
    // @ts-ignore
    input: inputconfig,
    ...appconfig
  }
}

module.exports = (() => {
  try {
    dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })
  } catch (err) {
    // Ignore missing dotenv file
  }

  return load
})()
