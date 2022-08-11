'use strict'

/**
 * @typedef {import("express").Application} Application
 */

const authService = require('./services/auth')
const contingentService = require('./services/contingent')
const employeeService = require('./services/employee')
const lpuService = require('./services/lpu')

/** @type {(config: ApplicationConfiguration, app: Application) => Application} Builds application routing. */
module.exports = (config, app) =>
  app
    .use('/auth', authService())
    .use('/contingent', contingentService(config))
    .use('/employee', employeeService(config))
    .use('/lpu', lpuService(config))
