'use strict'

const dotenv = require('dotenv')
const fs = require('fs/promises')
const path = require('path')
const { Buffer } = require('buffer')

const {
  blankStringSchema,
  extendJoiWithRegexSchema
} = require('../libs/joi_schema_helpers')

const Joi = extendJoiWithRegexSchema()
const JoiInteger = () => Joi.number().integer().positive()
const JoiString = () => Joi.string().empty(blankStringSchema())

/**
 * @param {string} name Name of configuration section.
 * @param {import('joi').Schema} schema Joi schema to validate and strip empty values.
 * @param {any} base Default configuration values.
 * @param  {...any} configs Configuration objects to validate and merge.
 * @returns {any} Merged configuration object.
 */
function mergeConfigSection(name, schema, base, ...configs) {
  const /** @type {any[]} */ diffs = []
  for (const config of configs) {
    const { error, value } = schema.validate(config, {
      abortEarly: false,
      allowUnknown: true,
      presence: 'optional'
    })

    if (error) {
      throw new Error('Invalid configuration section: ' + name, {
        cause: error
      })
    } else {
      diffs.push(
        Object.fromEntries(
          Object.entries(value).filter(entry => entry[1] !== undefined)
        )
      )
    }
  }

  return Object.assign(base, ...diffs)
}

/**
 * Reads JsonWebToken secret key from file.
 *
 * @returns {Promise<string?>} Secret as plain text.
 */
function readJwtKey() {
  return fs
    .readFile(path.resolve(__dirname, '..', '..', 'private', 'JWT_SECRET.key'))
    .then(data => data.toString('utf8'))
    .catch(() => null)
}

/**
 * @returns {Promise<Omit<Configuration, "input">>} Validated configuration object.
 */
async function loadApplicationConfig() {
  try {
    const jsonConfig = await fs
      .readFile(path.resolve(__dirname, 'appconfig.json'), 'utf8')
      .then(JSON.parse)
    const { db, server, ...config } = jsonConfig
    // JsonWebToken secret key.
    const jwtSecret = await readJwtKey()
    if (jwtSecret) {
      config.accessToken.secret = jwtSecret
    }
    // Joi schema object for validation application configuration.
    const schema = Joi.object({
      accessToken: Joi.object({
        algorithm: JoiString(),
        expiresIn: JoiInteger(),
        issuer: JoiString().uri(),
        secret: JoiString().base64()
      }),
      db: Joi.object({
        dbname: JoiString(),
        uri: JoiString().uri({ scheme: 'mongodb' })
      }),
      general: Joi.object({
        passwdHashSize: JoiInteger().min(32)
      }),
      genops: Joi.object({
        employeeId: Joi.object({
          length: JoiInteger().min(4).max(10),
          prefix: JoiInteger()
            .less(Joi.ref('length', { adjust: len => Math.pow(10, len - 2) }))
            .optional()
        })
      }),
      routes: Joi.object().pattern(Joi.string(), Joi.string()),
      server: Joi.object({
        env: JoiString().optional(),
        host: JoiString().ip({ cidr: 'forbidden' }).optional(),
        port: Joi.number().port(),
        logLevel: JoiString().allow('error', 'warn', 'info', 'debug').optional()
      })
    })

    const appconfig = Joi.attempt(
      {
        db: mergeConfigSection('db', schema.extract('db'), db, {
          dbname: process.env.MONGODB_DB,
          uri: process.env.MONGODB_URI
        }),
        server: mergeConfigSection('server', schema.extract('server'), server, {
          env: process.env.NODE_ENV,
          host: process.env.SERVER_HOST,
          port: process.env.SERVER_PORT,
          logLevel: process.env.LOG_LEVEL
        }),
        ...config
      },
      schema,
      {
        abortEarly: false,
        allowUnknown: true,
        convert: true,
        presence: 'required'
      }
    )

    const accessTokenSecret = appconfig.accessToken.secret
    if (typeof accessTokenSecret === 'string') {
      appconfig.accessToken.secret = Buffer.from(accessTokenSecret, 'base64')
    }

    return appconfig
  } catch (error) {
    // @ts-ignore
    throw new Error('Invalid application configuration', { cause: error })
  }
}

/**
 * @returns {Promise<Configuration["input"]>} User input validation options.
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
          name: Joi.object({ pattern: Joi.regex().required() }),
          password: Joi.object({ pattern: Joi.regex().required() })
        }),
        examination: Joi.object({
          name: Joi.object({ pattern: Joi.regex().required() })
        }),
        lpu: Joi.object({
          opf: Joi.object({ pattern: Joi.regex().required() })
        })
      }),
      { abortEarly: false, allowUnknown: true }
    )
  } catch (error) {
    // @ts-ignore
    throw new Error('Invalid input validation configuration', { cause: error })
  }
}

/**
 * @returns {Promise<Configuration>} Complete application configuration object.
 */
async function load() {
  const appconfig = await loadApplicationConfig()
  const inputconfig = await loadInputValidationConfig()

  return {
    input: inputconfig,
    ...appconfig
  }
}

module.exports = (() => {
  try {
    dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })
  } catch (error) {
    // Ignore missing dotenv file
  }

  return load
})()
