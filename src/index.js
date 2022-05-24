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

  const [dbclient, dbconnect] = await initDb(dbconfig)
  try {
    const db = dbconnect()
    const logger = initLogger(logLevel)

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

/**
 * @param {Configuration['db']} config
 * @returns {Promise<[mongodb.MongoClient, () => mongodb.Db]>}
 */
async function initDb(config) {
  const { dbname, host, port, ...options } = config
  const client = await mongodb.MongoClient.connect(
    `mongodb://${host}:${port}`,
    options
  )

  return [client, () => client.db(dbname)]
}

/**
 * @param {string} [level=error] Logging level.
 */
function initLogger(level) {
  // @ts-ignore
  return pino({
    enabled: level ? true : false,
    level: level ?? 'error'
  })
}

module.exports = application
