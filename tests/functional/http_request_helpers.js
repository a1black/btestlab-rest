'use strict'

/**
 * @typedef {supertest.SuperTest<supertest.Test>} SuperTestRequest
 */

const path = require('path')
const supertest = require('supertest')

const initApplication = require('../../src')
const initConfiguration = require('../../src/configs')
const { generateUserJwt } = require('../../src/libs/access_control_helpers')

/**
 * @param {boolean} [admin] Grand admin privileges.
 * @returns {Promise<[string, { type: "bearer" }]>} Request authentication options.
 */
async function generateAccessToken(admin) {
  const config = await initConfiguration()

  const token = await generateUserJwt(
    {
      admin: admin === true,
      birthdate: new Date(),
      firstname: 'testuser',
      lastname: 'testuser',
      middlename: 'testuser',
      sex: 'm'
    },
    { ...config.accessToken, expiresIn: 86400 }
  )

  return [token, { type: 'bearer' }]
}

/** @type {() => () => Promise<[SuperTestRequest, () => Promise<void>]>} */
function requestFactory() {
  let /** @type {SuperTestRequest} */ request
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
        // @ts-ignore
        request = undefined
        teardown = async () => undefined
      }
    ]
  }
}

/** @type {(base: string) => (...urlpath: string[]) => string} */
function urlpathFactory(base) {
  return (...urlpath) => path.join(base, ...urlpath)
}

module.exports = {
  generateAccessToken,
  requestFactory,
  urlpathFactory
}
