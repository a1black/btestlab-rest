'use strict'

const mongodb = require('mongodb')
const pino = require('pino')

const configuration = require('./config')
const globals = require('./globals')
const router = require('./routes')

/**
 * @returns {Promise<Application>} Express application instance and startup function.
 */
async function application() {
  const { db: dbconfig, env, host, logLevel, port, ...config } = configuration()
  const dbclient = await mongodb.MongoClient.connect(dbconfig.uri)

  try {
    const db = dbclient.db(dbconfig.dbname)
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

    return [app, () => app.listen(port, host)]
  } catch (error) {
    await dbclient.close(true)
    throw error
  }
}

module.exports = application
