'use strict'

const { invalidLpu, validLpu } = require('../data_helpers')
const { clearCollection } = require('../db_helpers')
const { requestFactory, pathjoin, generateAccessToken } = require('../http_request_helpers')

const { CollectionNameEnum } = require('../../../src/globals')

/** @type {typeof pathjoin} */
const urlpath = (...parts) => pathjoin('/lpu', ...parts)
const fakepath = urlpath(1)

describe('access control', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  test('unauthenticated create, expect 401', async () => {
    const [request] = await requestProvider()
    const response = await request.post(urlpath()).send({})

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('unauthenticated delete, expect 401', async () => {
    const [request] = await requestProvider()
    const response = await request.delete(fakepath).send()

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('unauthenticated read, expect 401', async () => {
    const [request] = await requestProvider()
    const response = await request.get(fakepath).send({})

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('unauthenticated update, expect 401', async () => {
    const [request] = await requestProvider()
    const response = await request.put(fakepath).send({})

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('unauthorized create, expect 403', async () => {
    const auth = await generateAccessToken(false)
    const [request] = await requestProvider()
    const response = await request
      .post(urlpath())
      .auth(...auth)
      .send({})

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('unauthorized delete, expect 403', async () => {
    const auth = await generateAccessToken(false)
    const [request] = await requestProvider()
    const response = await request
      .delete(fakepath)
      .auth(...auth)
      .send()

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })
})

describe('lpu.create', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.LPU)
  })

  test('invalid post data, expect 400', async () => {
    const auth = await generateAccessToken(true)
    const doc = invalidLpu()
    const [request] = await requestProvider()
    const response = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      errors: expect.objectContaining({
        abbr: expect.any(String),
        code: expect.any(String),
        dep: expect.any(String),
        name: expect.any(String),
        opf: expect.any(String)
      })
    })
  })

  test('valid post data, expect 200', async () => {
    const auth = await generateAccessToken(true)
    const doc = await validLpu()
    const [request] = await requestProvider()
    const response = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ id: expect.any(Number) })
  })
})

describe('lpu.delete', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.LPU)
  })

  test('delete non-existing document, expect 404', async () => {
    const auth = await generateAccessToken(true)
    const [request] = await requestProvider()
    const response = await request
      .delete(fakepath)
      .auth(...auth)
      .send()

    expect(response.status).toBe(404)
  })

  test('delete existing document, expect 200', async () => {
    const auth = await generateAccessToken(true)
    const doc = await validLpu()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const deleteRes = await request
      .delete(urlpath(createRes.body.id))
      .auth(...auth)
      .send()
    expect(deleteRes.status).toBe(200)

    const response = await request
      .get(urlpath(createRes.body.id))
      .auth(...auth)
      .send()
    expect(response.status).toBe(404)
  })
})

describe('lpu.read', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.LPU)
  })

  test('read non-existing document, expect 404', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()
    const response = await request
      .get(fakepath)
      .auth(...auth)
      .send()

    expect(response.status).toBe(404)
  })

  test('read existing document, expect 200', async () => {
    const doc = await validLpu()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...(await generateAccessToken(true)))
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const response = await request
      .get(urlpath(createRes.body.id))
      .auth(...(await generateAccessToken()))
      .send()

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      doc: expect.objectContaining({
        id: createRes.body.id,
        code: doc.code,
        dep: doc.dep
      })
    })
  })
})

describe('lpu.update', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.LPU)
  })

  test('update non-existing document, expect 404', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()
    const response = await request
      .get(fakepath)
      .auth(...auth)
      .send()

    expect(response.status).toBe(404)
  })

  test('update existing document, expect 200', async () => {
    const doc = await validLpu()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...(await generateAccessToken(true)))
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const response = await request
      .get(urlpath(createRes.body.id))
      .auth(...(await generateAccessToken()))
      .send()

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      doc: expect.objectContaining({
        id: createRes.body.id,
        code: doc.code,
        dep: doc.dep
      })
    })
  })
})
