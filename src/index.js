'use strict'

const mongodb = require('mongodb')
const pino = require('pino')
const objectGet = require('lodash.get')

const configuration = require('./configs')
const router = require('./routes')

/**
 * @returns {Promise<Application>} Express application instance and startup function.
 */
async function application() {
  const { db: dbconf, server: serverconf, ...config } = await configuration()
  const { env = 'production', host, logLevel, port } = serverconf ?? {}
  const dbclient = await mongodb.MongoClient.connect(dbconf.uri)

  try {
    const db = dbclient.db(dbconf.dbname)
    // @ts-ignore
    const logger = pino({
      enabled: logLevel ? true : false,
      level: logLevel ?? 'error'
    })

    const app = router()
      .enable('strict routing')
      .enable('trust proxy')
      .disable('x-powered-by')
      .set('env', env)

    app.use((req, _, next) => {
      req.context = { client: dbclient, db, logger }

      req.config = (path, _default) => objectGet(config, path, _default)
      req.isInternal = () => req.get('X-Internal-Addr') === '1'

      next()
    })

    return [
      app,
      () => (host && port ? app.listen(port, host) : app.listen(port))
    ]
  } catch (error) {
    await dbclient.close(true)
    throw error
  }
}

module.exports = application
