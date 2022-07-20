'use strict'

const mongodb = require('mongodb')
const pino = require('pino')

const configuration = require('./configs')
const globals = require('./globals')
const router = require('./routes')

/**
 * @returns {Promise<Application>} Express application instance and startup function.
 */
async function application() {
  const { db: dbconf, server: serverconf, ...config } = await configuration()
  const dbclient = await mongodb.MongoClient.connect(dbconf.uri)

  try {
    const db = dbclient.db(dbconf.dbname)
    // @ts-ignore
    const logger = pino({
      enabled: serverconf.logLevel ? true : false,
      level: serverconf.logLevel ?? 'error'
    })

    const app = router()
      .enable('strict routing')
      .enable('trust proxy')
      .disable('x-powered-by')
      .set('env', serverconf.env ?? 'production')

    app.use((req, _, next) => {
      // Add application's global state to the processed request.
      req.context = {
        client: dbclient,
        config,
        db,
        logger
      }
      // Application global constants.
      req.globals = globals
      // Extend request with application specific methods.a
      req.isInternal = () => req.get('X-Internal-Addr') === '1'

      next()
    })

    return [app, () => app.listen(serverconf.port, serverconf.host)]
  } catch (error) {
    await dbclient.close(true)
    throw error
  }
}

module.exports = application
