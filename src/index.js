'use strict'

/**
 * @typedef {import("express").Application} Application
 * @typedef {import("http").Server} Server
 */

const express = require('express')
const mongodb = require('mongodb')
const pino = require('pino')
const objectGet = require('lodash.get')

const configuration = require('./configs')
const internalization = require('./libs/i18n')
const router = require('./routes')
const {
  dbErrorHandler,
  jsonErrorRequestHandler
} = require('./libs/error_handlers')
const { httpResponseAliases } = require('./libs/http_service_helpers')

/**
 * @returns {Promise<[Application, () => Server, () => Promise<void>]>} Express application instance, startup and teardown functions.
 */
async function application() {
  const { db: dbconf, server: serverconf, ...config } = await configuration()
  const { env = 'production', host, logLevel, port } = serverconf ?? {}
  // @ts-ignore
  const logger = pino({
    enabled: logLevel ? true : false,
    level: logLevel ?? 'error'
  })
  const i18n = await internalization({ defaultLocale: 'ru' })
  const dbclient = await mongodb.MongoClient.connect(dbconf.uri)

  try {
    const db = dbclient.db(dbconf.dbname)

    const app = express()
      .enable('strict routing')
      .enable('trust proxy')
      .disable('x-powered-by')
      .set('env', env)

    app.use((req, res, next) => {
      // Extend HTTP Request object
      req.config = (path, _default) => objectGet(config, path, _default)
      req.context = { client: dbclient, db }
      req.i18n = i18n()
      req.logger = logger
      req.isInternal = () => req.get('X-Internal-Addr') === '1'
      // Extend HTTP Response object
      httpResponseAliases(res)

      next()
    })
    // load routing
    router(config, app)
    // Attach error handlers
    app.use(dbErrorHandler, jsonErrorRequestHandler)

    return [
      app,
      () => (host ? app.listen(port, host) : app.listen(port)),
      () => dbclient.close()
    ]
  } catch (error) {
    await dbclient.close(true)
    throw error
  }
}

module.exports = application
