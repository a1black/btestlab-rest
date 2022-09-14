'use strict'

const crypto = require('crypto')
const { Buffer } = require('buffer')

const { randomString, validEmployee } = require('../data_helpers')
const { clearCollection, connect } = require('../db_helpers')
const { requestFactory, servicePathProvider } = require('../http_request_helpers')

const { CollectionNameEnum } = require('../../../src/globals')

/**
 * @param {Partial<User>} [options] Provider options.
 */
function userFactory(options) {
  async function produce() {
    /** @type {any} */
    const user = await validEmployee()
    user._id = crypto.randomInt(1000)
    user.admin = admin
    user.ctime = new Date()
    if (!user.password) {
      user.password = 'password'
    }

    const salt = Buffer.from(randomString({ locale: 'en' }), 'utf-8')
    const hash = salt.toString('base64url') + ':' + crypto.scryptSync(user.password, salt, 32).toString('base64url')

    const [client, db] = await connect()
    await db.collection(CollectionNameEnum.USER).insertOne({ ...user, password: hash })
    await client.close(true)

    return user
  }

  const { admin = false } = options ?? {}
  let /** @type {any} */ user

  return async () => {
    if (!user) {
      user = await produce()
    }

    return [
      user,
      async () => {
        if (user._id) {
          const [client, db] = await connect()
          await db.collection(CollectionNameEnum.USER).deleteOne({ _id: user._id })
          await client.close(true)
        }

        user = undefined
      }
    ]
  }
}

describe('login and password authentication', () => {
  const authPath = servicePathProvider('auth')
  const requestProvider = requestFactory()
  const userProvider = userFactory()

  beforeAll(async () => {
    await requestProvider()
    await userProvider()
  })

  afterAll(async () => {
    const [, reqTeardown] = await requestProvider()

    await clearCollection(CollectionNameEnum.USER)
    await reqTeardown()
  })

  test('no password, expect 400', async () => {
    const url = await authPath()
    const [request] = await requestProvider()
    const [user] = await userProvider()

    const response = await request.post(url).send({ login: user._id })

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      message: expect.any(String),
      errors: { login: expect.any(String), password: expect.any(String) }
    })
  })

  test('invalid credentials, expect 400', async () => {
    const url = await authPath()
    const [request] = await requestProvider()
    const [user] = await userProvider()

    const response = await request.post(url).send({ login: user._id + 1, password: user.password + '1' })

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      message: expect.any(String),
      errors: { login: expect.any(String), password: expect.any(String) }
    })
  })

  test('valid credentials, expect 200', async () => {
    const url = await authPath()
    const [request] = await requestProvider()
    const [user] = await userProvider()

    const response = await request.post(url).send({ login: user._id, password: user.password })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ accessToken: expect.any(String) })
  })
})

describe('authenticate trusted source', () => {
  const adminProvider = userFactory({ admin: true })
  const authPath = servicePathProvider('auth')
  const requestProvider = requestFactory()
  const userProvider = userFactory()

  beforeAll(async () => {
    await requestProvider()
    await userProvider()
  })

  afterAll(async () => {
    const [, reqTeardown] = await requestProvider()

    await clearCollection(CollectionNameEnum.USER)
    await reqTeardown()
  })

  test('invalid login, expect 400', async () => {
    const url = await authPath()
    const [request] = await requestProvider()
    const [user] = await userProvider()

    const response = await request
      .post(url)
      .set('X-Internal-Addr', '1')
      .send({ login: user._id + 1 })

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      message: expect.any(String),
      errors: { login: expect.any(String) }
    })
  })

  test('non-admin without password, expect 200', async () => {
    const url = await authPath()
    const [request] = await requestProvider()
    const [user] = await userProvider()

    const response = await request.post(url).set('X-Internal-Addr', '1').send({ login: user._id })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ accessToken: expect.any(String) })
  })

  test('non-admin with invalid password, expect 200', async () => {
    const url = await authPath()
    const [request] = await requestProvider()
    const [user] = await userProvider()

    const response = await request
      .post(url)
      .set('X-Internal-Addr', '1')
      .send({ login: user._id, password: user.password + '1' })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ accessToken: expect.any(String) })
  })

  test('admin without password, expect 400', async () => {
    const url = await authPath()
    const [request] = await requestProvider()
    const [user] = await adminProvider()

    const response = await request.post(url).set('X-Internal-Addr', '1').send({ login: user._id })

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      message: expect.any(String),
      errors: { password: expect.any(String) }
    })
  })

  test('admin with invalid password, expect 400', async () => {
    const url = await authPath()
    const [request] = await requestProvider()
    const [user] = await adminProvider()

    const response = await request
      .post(url)
      .set('X-Internal-Addr', '1')
      .send({ login: user._id, password: user.password + '1' })

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      message: expect.any(String),
      errors: { password: expect.any(String) }
    })
  })

  test('valid admin credentials, expect 200', async () => {
    const url = await authPath()
    const [request] = await requestProvider()
    const [user] = await adminProvider()

    const response = await request
      .post(url)
      .set('X-Internal-Addr', '1')
      .send({ login: user._id, password: user.password })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ accessToken: expect.any(String) })
  })
})
