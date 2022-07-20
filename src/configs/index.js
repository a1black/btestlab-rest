'use strict'

const Joi = require('joi')
const dotenv = require('dotenv')
const fs = require('fs/promises')
const path = require('path')

const DB_SCHEMA = Joi.object({
  dbname: Joi.string(),
  uri: Joi.string().uri({ scheme: 'mongodb' })
})
const GENOPS_SCHEMA = Joi.object({
  employeeCode: Joi.object({
    length: Joi.number()
      .positive()
      .greater(Joi.ref('prefix', { adjust: value => value.length })),
    prefix: Joi.string().pattern(/^\d+$/)
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
  logLevel: Joi.string().allow('error', 'warn', 'info', 'debug')
})

/** @type {() => Promise<string|undefined>} */
const readJwtKey = () =>
  fs
    .readFile(path.resolve(__dirname, '..', '..', 'private', 'JWT_SECRET.key'))
    .then(data => data.toString('utf8'))
    .catch(() => undefined)
/** @type {(value: Dict, schema: Joi.ObjectSchema) => Dict} */
const validateSection = (value, schema) =>
  Joi.attempt(value, schema, { abortEarly: false, allowUnknown: true })
/** @type {(value: Dict) => Dict} */
const validateDb = value => validateSection(value, DB_SCHEMA)
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
function loadInputValidationConfig() {
  return fs
    .readFile(path.resolve(__dirname, 'inputconfig.json'), 'utf8')
    .then(JSON.parse)
    .catch(error => {
      throw new Error('Invalid input validation configuration', {
        cause: error
      })
    })
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
