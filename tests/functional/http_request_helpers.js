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
 * @param {boolean | { admin?: boolean , id?: any }} [options] Grand admin privileges.
 * @returns {Promise<[string, { type: "bearer" }]>} Request authentication options.
 */
async function generateAccessToken(options) {
  const { admin = false, id = undefined } =
    typeof options === 'boolean' ? { admin: options } : options ?? {}
  const config = await initConfiguration()

  const token = await generateUserJwt(
    {
      _id: id,
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

/** @type {(...parts: any[]) => string} */
function pathjoin(...parts) {
  return path.join(...parts.map(v => v.toString()))
}

module.exports = {
  generateAccessToken,
  requestFactory,
  pathjoin
}
