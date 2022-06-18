'use strict'

const Joi = require('joi')
const dotenv = require('dotenv')
const path = require('path')
const { Buffer } = require('buffer')

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
    issuer: 'https://voib2lab.ru',
    secret: process.env.JWT_SECRET,
    ttl: 24 * 3600
  },
  db: {
    dbname: 'exam_journal',
    uri: process.env.MONGODB_URI
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
    host: Joi.string().ip({ cidr: 'forbidden' }).default('0.0.0.0').optional(),
    port: Joi.number().port().default(80).optional(),
    env: Joi.string(),
    logLevel: Joi.string().allow('error', 'warn', 'info', 'debug').optional(),
    accessToken: Joi.object({
      issuer: Joi.string().uri(),
      secret: Joi.string().base64(),
      ttl: Joi.number().integer().positive()
    }),
    db: Joi.object({
      dbname: Joi.string(),
      uri: Joi.string().uri({ scheme: 'mongodb' })
    })
  })
}

/**
 * @returns {Configuration} Verified configuration object.
 */
function load() {
  const { error, value } = configValidationSchema().validate(CONFIG, {
    abortEarly: false,
    allowUnknown: true,
    presence: 'required'
  })
  if (error) {
    throw error
  } else {
    value['accessToken']['secret'] = Buffer.from(
      value['accessToken']['secret'],
      'base64'
    )
  }

  return value
}

module.exports = load
