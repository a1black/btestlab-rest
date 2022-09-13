'use strict'

/**
 * @typedef {import("express").Application} Application
 */

const authService = require('./services/auth')
const contingentService = require('./services/contingent')
const employeeService = require('./services/employee')
const examinationService = require('./services/examination')
const lpuService = require('./services/lpu')

/** @type {(config: ApplicationConfiguration, app: Application) => Application} Builds application routing. */
module.exports = (config, app) =>
  app
    .use(config.routes.auth, authService())
    .use(config.routes.contingent, contingentService(config))
    .use(config.routes.employee, employeeService(config))
    .use(config.routes.examination, examinationService(config))
    .use(config.routes.lpu, lpuService(config))
