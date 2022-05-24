'use strict'

const Joi = require('joi')
const dotenv = require('dotenv')
const path = require('path')

const { ConstantEnum } = require('./globals')

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

/** Application configuration object. */
const CONFIG = {
  host: process.env.SERVER_HOST,
  port: process.env.SERVER_PORT,
  env: process.env.NODE_ENV,
  logLevel: process.env.LOG_LEVEL,
  accessToken: {
    adminKey: 'admin',
    algorithm: 'HS256',
    issuer: process.env.TOKEN_ISSUER,
    secret: process.env.TOKEN_KEY,
    ttl: 24 * 3600
  },
  db: {
    auth: {
      username: process.env.MONGODB_USERNAME,
      password: process.env.MONGODB_PASSWORD
    },
    authSource: 'admin',
    dbname: 'exam_journal',
    host: process.env.MONGODB_SERVER,
    port: process.env.MONGODB_PORT
  },
  passwd: {
    hashSize: 64,
    secret: process.env.PASSWD_KEY
  },
  validation: {
    employee: {
      password: {
        maxLength: 32,
        minLength: ConstantEnum.PASSWORD_MIN_LENGTH
      }
    }
  }
}

/**
 * @returns {Joi.ObjectSchema} Schema instance to validate configuration object.
 */
function configValidationSchema() {
  return Joi.object({
    host: Joi.string().empty('').hostname().default('0.0.0.0'),
    port: Joi.number().empty(0).port().default(80),
    env: Joi.string().empty('').default('production').optional(),
    logLevel: Joi.string()
      .empty('')
      .lowercase()
      .allow('error', 'warn', 'info', 'debug')
      .optional(),
    accessToken: Joi.object({
      issuer: Joi.string().uri(),
      secret: Joi.string(),
      ttl: Joi.number().integer().positive()
    }),
    passwd: Joi.object({
      secret: Joi.string().empty('').base64()
    }),
    db: Joi.object({
      auth: Joi.object({
        username: Joi.string(),
        password: Joi.string()
      }),
      dbname: Joi.string(),
      host: Joi.string().hostname(),
      port: Joi.number().empty(0).port()
    })
  }).prefs({ allowUnknown: true, noDefaults: false, presence: 'required' })
}

/**
 * @returns {Configuration} Verified configuration object.
 */
function load() {
  return Joi.attempt(CONFIG, configValidationSchema(), { abortEarly: false })
}

module.exports = load
