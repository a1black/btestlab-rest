'use strict'

/**
 * @typedef {supertest.SuperTest<supertest.Test>} SuperTestRequest
 */

const supertest = require('supertest')

const generateJwt = require('../../src/libs/accesstoken')
const initApplication = require('../../src')
const initConfiguration = require('../../src/configs')

/**
 * @param {Partial<User & { id: any }>} [user] Authenticated user data.
 * @returns {Promise<[string, { type: "bearer" }]>} Request authentication options.
 */
async function generateAccessToken(user) {
  const { id, _id, admin = false, ...rest } = user ?? {}
  const config = await initConfiguration()

  const token = await generateJwt(
    Object.assign(
      {
        birthdate: new Date(),
        firstname: 'testuser',
        lastname: 'testuser',
        middlename: 'testuser',
        sex: 'm'
      },
      {
        _id: _id ?? id,
        admin: admin === true,
        ...rest
      }
    ),
    { ...config.accessToken, expiresIn: 86400 }
  )

  return [token, { type: 'bearer' }]
}

/** @type {() => () => Promise<[SuperTestRequest, () => Promise<void>]>} */
function requestFactory() {
  let /** @type {SuperTestRequest?} */ request
  let /** @type {() => Promise<void>} */ teardown

  return async () => {
    if (!request) {
      const [app, , disconnect] = await initApplication()
      request = supertest(app)
      teardown = disconnect
    }

    return [
      request,
      async () => {
        await teardown()
        request = null
        teardown = async () => undefined
      }
    ]
  }
}

/**
 * @param {keyof ApplicationConfiguration["routes"]} service
 */
function servicePathProvider(service) {
  let /** @type {string} */ path

  return async () => {
    if (service && !path) {
      const config = await initConfiguration()
      path = config.routes[service]
    }
    if (!path) {
      // @ts-ignore
      service = undefined
      throw new Error('Unknown service path')
    }

    return path
  }
}

module.exports = {
  generateAccessToken,
  requestFactory,
  servicePathProvider
}
