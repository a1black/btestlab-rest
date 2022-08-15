'use strict'

const { invalidLpu, validLpu } = require('../data_helpers')
const { clearCollection } = require('../db_helpers')
const { requestFactory, pathjoin, generateAccessToken } = require('../http_request_helpers')

const { CollectionNameEnum } = require('../../../src/globals')

/** @type {typeof pathjoin} */
const urlpath = (...parts) => pathjoin('/lpu', ...parts)
/** @type {typeof pathjoin} */
const fakepath = (...parts) => urlpath(1, ...parts)

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

  test('unauthenticated read, expect 401', async () => {
    const [request] = await requestProvider()
    const response = await request.get(fakepath()).send({})

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('unauthenticated update, expect 401', async () => {
    const [request] = await requestProvider()
    const response = await request.put(fakepath()).send({})

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('unauthenticated activate, expect 401', async () => {
    const [request] = await requestProvider()
    const response = await request.put(fakepath('activate')).send()

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('unauthenticated deactivate, expect 401', async () => {
    const [request] = await requestProvider()
    const response = await request.put(fakepath('deactivate')).send()

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
      .get(fakepath())
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
        abbr: doc.abbr,
        opf: doc.opf
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
      .get(fakepath())
      .auth(...auth)
      .send()

    expect(response.status).toBe(404)
  })

  test('update existing document, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validLpu()
    const upd = await validLpu()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...(await generateAccessToken(true)))
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const updateRes = await request
      .put(urlpath(createRes.body.id))
      .auth(...auth)
      .send(upd)
    expect(updateRes.status).toBe(200)

    const readRes = await request
      .get(urlpath(createRes.body.id))
      .auth(...auth)
      .send()
    expect(readRes.status).toBe(200)
    expect(readRes.body).toMatchObject({
      doc: expect.objectContaining({
        modified: expect.anything()
      })
    })
  })
})

describe('lpu.activate/deactivate', () => {
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

  test('activate non-existing document, expect 404', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()
    const response = await request
      .put(fakepath('activate'))
      .auth(...auth)
      .send()

    expect(response.status).toBe(404)
  })

  test('deactivate non-existing document, expect 404', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()
    const response = await request
      .put(fakepath('deactivate'))
      .auth(...auth)
      .send()

    expect(response.status).toBe(404)
  })

  test('repeated activate request, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validLpu()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...(await generateAccessToken(true)))
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const activateRes = await request
      .put(urlpath(createRes.body.id, 'activate'))
      .auth(...auth)
      .send()
    expect(activateRes.status).toBe(200)

    const reactivateRes = await request
      .put(urlpath(createRes.body.id, 'activate'))
      .auth(...auth)
      .send()
    expect(reactivateRes.status).toBe(200)

    const readRes = await request
      .get(urlpath(createRes.body.id))
      .auth(...auth)
      .send()

    expect(readRes.status).toBe(200)
    expect(readRes.body).toMatchObject({
      doc: expect.not.objectContaining({
        disabled: expect.anything()
      })
    })
  })

  test('repeated deactivate request, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validLpu()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...(await generateAccessToken(true)))
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const deactivateRes = await request
      .put(urlpath(createRes.body.id, 'deactivate'))
      .auth(...auth)
      .send()
    expect(deactivateRes.status).toBe(200)

    const readRes = await request
      .get(urlpath(createRes.body.id))
      .auth(...auth)
      .send()

    expect(readRes.status).toBe(200)
    expect(readRes.body).toMatchObject({
      doc: expect.objectContaining({
        disabled: expect.anything()
      })
    })
  })
})

describe('duplicate lpu abbr', () => {
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

  test('duplicate on create, expect 409', async () => {
    const auth = await generateAccessToken(true)
    const doc = await validLpu()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const response = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      id: createRes.body.id,
      doc: expect.objectContaining({
        abbr: doc.abbr
      }),
      errors: {
        abbr: expect.anything()
      }
    })
  })

  test('duplicate on update, expect 409', async () => {
    const auth = await generateAccessToken(true)
    const firstDoc = await validLpu()
    const secondDoc = await validLpu()
    const [request] = await requestProvider()

    const firstCreateRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(firstDoc)
    expect(firstCreateRes.status).toBe(200)
    expect(firstCreateRes.body).toMatchObject({ id: expect.anything() })

    const secondCreateRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(secondDoc)
    expect(firstCreateRes.status).toBe(200)
    expect(firstCreateRes.body).toMatchObject({ id: expect.anything() })

    const response = await request
      .put(urlpath(secondCreateRes.body.id))
      .auth(...auth)
      .send(firstDoc)

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      id: firstCreateRes.body.id,
      doc: expect.objectContaining({
        abbr: firstDoc.abbr
      }),
      errors: {
        abbr: expect.anything()
      }
    })
  })
})

describe('other', () => {
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

  test('new lpu always deactivated, expect true', async () => {
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
        disabled: expect.anything()
      })
    })
  })
})
