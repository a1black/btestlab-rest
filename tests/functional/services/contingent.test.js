'use strict'

const { invalidContingent, validContingent } = require('../data_helpers')
const { clearCollection } = require('../db_helpers')
const { requestFactory, pathjoin, generateAccessToken } = require('../http_request_helpers')

const { CollectionNameEnum } = require('../../../src/globals')

/** @type {typeof pathjoin} */
const urlpath = (...parts) => pathjoin('/contingent', ...parts)

describe('unauthenticated request', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  test('create, expect 401', async () => {
    const [request] = await requestProvider()
    const response = await request.post(urlpath()).send({})

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('delete, expect 401', async () => {
    const doc = await validContingent('1000')
    const [request] = await requestProvider()
    const response = await request.delete(urlpath(doc.code)).send()

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('read, expect 401', async () => {
    const doc = await validContingent('1000')
    const [request] = await requestProvider()
    const response = await request.get(urlpath(doc.code)).send({})

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('update, expect 401', async () => {
    const doc = await validContingent('1000')
    const [request] = await requestProvider()
    const response = await request.put(urlpath(doc.code)).send({})

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })
})

describe('contingent.create', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.CONTINGENT)
  })

  test('invalid post data, expect 400', async () => {
    const auth = await generateAccessToken()
    const doc = invalidContingent()
    const [request] = await requestProvider()
    const response = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      errors: expect.objectContaining({ code: expect.any(String), desc: expect.any(String) })
    })
  })

  test('valid post data, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const [request] = await requestProvider()
    const response = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ id: expect.any(String) })
  })

  test('duplicate document, expect 409', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const [request] = await requestProvider()

    const response = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(response.status).toBe(200)

    const duplicateRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)

    expect(duplicateRes.status).toBe(409)
    expect(duplicateRes.body).toMatchObject({
      id: doc.code,
      errors: { code: expect.anything() }
    })
  })
})

describe('contingent.delete', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.CONTINGENT)
  })

  test('delete existing document, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(createRes.status).toBe(200)

    const deleteRes = await request
      .delete(urlpath(doc.code))
      .auth(...auth)
      .send()

    expect(deleteRes.status).toBe(200)
  })

  test('delete document marked as deleted, expect 404', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(createRes.status).toBe(200)

    const firstDeleteRes = await request
      .delete(urlpath(doc.code))
      .auth(...auth)
      .send()
    expect(firstDeleteRes.status).toBe(200)

    const secondDeleteRes = await request
      .delete(urlpath(doc.code))
      .auth(...auth)
      .send()

    expect(secondDeleteRes.status).toBe(404)
    expect(secondDeleteRes.body).toMatchObject({ message: expect.any(String) })
  })

  test('duplicate unique index `{ dtime: 1, code: 1 }`, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const [request] = await requestProvider()

    const firstCreateRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(firstCreateRes.status).toBe(200)

    const firstDeleteRes = await request
      .delete(urlpath(doc.code))
      .auth(...auth)
      .send()
    expect(firstDeleteRes.status).toBe(200)

    const secondCreateRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(secondCreateRes.status).toBe(200)

    const secondDeleteRes = await request
      .delete(urlpath(doc.code))
      .auth(...auth)
      .send()

    expect(secondDeleteRes.status).toBe(200)
  })
})

describe('contingent.read', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.CONTINGENT)
  })

  test('read non-existing document, expect 404', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent('1000')
    const [request] = await requestProvider()
    const response = await await request
      .get(urlpath(doc.code))
      .auth(...auth)
      .send()

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('read deleted document, expect 404', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(createRes.status).toBe(200)

    const deleteRes = await request
      .delete(urlpath(doc.code))
      .auth(...auth)
      .send()
    expect(deleteRes.status).toBe(200)

    const readRes = await request
      .get(urlpath(doc.code))
      .auth(...auth)
      .send()

    expect(readRes.status).toBe(404)
    expect(readRes.body).toMatchObject({ message: expect.any(String) })
  })

  test('read existing document, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(createRes.status).toBe(200)

    const readRes = await request
      .get(urlpath(doc.code))
      .auth(...auth)
      .send()

    expect(readRes.status).toBe(200)
    expect(readRes.body).toMatchObject({
      doc: expect.objectContaining({
        id: expect.any(String),
        desc: expect.any(String)
      })
    })
  })
})

describe('contingent.update', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.CONTINGENT)
  })

  test('update non-existing document, expect 404', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent('1000')
    const [request] = await requestProvider()
    const response = await await request
      .put(urlpath(doc.code))
      .auth(...auth)
      .send({})

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('read deleted document, expect 404', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(createRes.status).toBe(200)

    const deleteRes = await request
      .delete(urlpath(doc.code))
      .auth(...auth)
      .send()
    expect(deleteRes.status).toBe(200)

    const updateRes = await request
      .put(urlpath(doc.code))
      .auth(...auth)
      .send({})

    expect(updateRes.status).toBe(404)
    expect(updateRes.body).toMatchObject({ message: expect.any(String) })
  })

  test('update existing document, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(createRes.status).toBe(200)

    const updateRes = await request
      .put(urlpath(doc.code))
      .auth(...auth)
      .send({ desc: 'new' })

    expect(updateRes.status).toBe(200)
  })
})
