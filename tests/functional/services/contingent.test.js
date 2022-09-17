'use strict'

const { invalidContingent, validContingent } = require('../data_helpers')
const { clearCollection } = require('../db_helpers')
const { generateAccessToken, requestFactory, servicePathProvider } = require('../http_request_helpers')

const { CollectionNameEnum } = require('../../../src/globals')

/** @type {() => (...path: any[]) => Promise<string>} */
const urlpath = () => {
  const base = servicePathProvider('contingent')

  return (...path) => base().then(basepath => [basepath, ...path].join('/'))
}

/** @type {(request: any) => Promise<{ contingent: any, url: { create: string, delete: string, read: string, update: string }}>} */
async function createContingentFixture(request) {
  const auth = await generateAccessToken()
  const doc = await validContingent()
  const url = await urlpath()()

  const response = await request
    .post(url)
    .auth(...auth)
    .send(doc)
  expect(response.status).toBe(200)
  expect(response.body.links).toMatchObject({
    create: expect.any(String),
    delete: expect.any(String),
    read: expect.any(String),
    update: expect.any(String)
  })

  return { contingent: doc, url: response.body.links }
}

/** @type {(request: any, url: string) => Promise<void>} */
async function deleteContingentFixture(request, url) {
  const auth = await generateAccessToken()

  const response = await request
    .delete(url)
    .auth(...auth)
    .send()
  expect(response.status).toBe(200)
}

describe('unauthenticated request', () => {
  const contingentPath = urlpath()
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  test('create, expect 401', async () => {
    const url = await contingentPath()
    const [request] = await requestProvider()

    const response = await request.post(url).send({})
    expect(response.status).toBe(401)
  })

  test('delete, expect 401', async () => {
    const url = await contingentPath(100)
    const [request] = await requestProvider()

    const response = await request.delete(url).send()
    expect(response.status).toBe(401)
  })

  test('read, expect 401', async () => {
    const url = await contingentPath(100)
    const [request] = await requestProvider()

    const response = await request.get(url).send({})
    expect(response.status).toBe(401)
  })

  test('update, expect 401', async () => {
    const url = await contingentPath(100)
    const [request] = await requestProvider()

    const response = await request.put(url).send({})
    expect(response.status).toBe(401)
  })
})

describe('contingent.create', () => {
  const contingentPath = urlpath()
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
    const url = await contingentPath()
    const [request] = await requestProvider()

    const createResponse = await request
      .post(url)
      .auth(...auth)
      .send(doc)
    expect(createResponse.status).toBe(400)
    expect(createResponse.body).toMatchObject({
      errors: expect.objectContaining({
        code: expect.any(String),
        desc: expect.any(String)
      })
    })
  })

  test('valid post data, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const url = await contingentPath()
    const [request] = await requestProvider()

    const createResponse = await request
      .post(url)
      .auth(...auth)
      .send(doc)
    expect(createResponse.status).toBe(200)
    expect(createResponse.body).toMatchObject({
      links: expect.objectContaining({ read: expect.any(String) })
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

  test('delete non-existing document, expect 404', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { url } = await createContingentFixture(request)
    await deleteContingentFixture(request, url.delete)

    const deleteResponse = await request
      .delete(url.delete)
      .auth(...auth)
      .send()
    expect(deleteResponse.status).toBe(404)
  })

  test('delete existing document, expect 200', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { url } = await createContingentFixture(request)

    const deleteResponse = await request
      .delete(url.delete)
      .auth(...auth)
      .send()
    expect(deleteResponse.status).toBe(200)

    const readResponse = await request
      .get(url.read)
      .auth(...auth)
      .send()
    expect(readResponse.status).toBe(404)
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
    const [request] = await requestProvider()

    const { url } = await createContingentFixture(request)
    await deleteContingentFixture(request, url.delete)

    const readResponse = await await request
      .get(url.read)
      .auth(...auth)
      .send()
    expect(readResponse.status).toBe(404)
  })

  test('read existing document, expect 200', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { url } = await createContingentFixture(request)

    const readResponse = await request
      .get(url.read)
      .auth(...auth)
      .send()
    expect(readResponse.status).toBe(200)
    expect(readResponse.body).toMatchObject({
      doc: expect.anything(),
      links: expect.objectContaining({
        create: expect.any(String),
        delete: expect.any(String),
        read: expect.any(String),
        update: expect.any(String)
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
    const doc = await validContingent()
    const [request] = await requestProvider()

    const { url } = await createContingentFixture(request)
    await deleteContingentFixture(request, url.delete)

    const updateResponse = await await request
      .put(url.update)
      .auth(...auth)
      .send(doc)
    expect(updateResponse.status).toBe(404)
  })

  test('invalid update document, expect 400', async () => {
    const auth = await generateAccessToken()
    const doc = invalidContingent()
    const [request] = await requestProvider()

    const { url } = await createContingentFixture(request)

    const updateResponse = await request
      .put(url.update)
      .auth(...auth)
      .send(doc)
    expect(updateResponse.status).toBe(400)
    expect(updateResponse.body).toMatchObject({
      errors: { desc: expect.any(String) }
    })
  })

  test('update existing document, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validContingent()
    const [request] = await requestProvider()

    const { url } = await createContingentFixture(request)

    const updateResponse = await request
      .put(url.update)
      .auth(...auth)
      .send(doc)
    expect(updateResponse.status).toBe(200)

    const readResponse = await request
      .get(url.read)
      .auth(...auth)
      .send()
    expect(readResponse.status).toBe(200)
    expect(readResponse.body.doc).toMatchObject({
      created: expect.any(Number),
      modified: expect.any(Number)
    })
    expect(readResponse.body.doc.created).toBeLessThan(readResponse.body.doc.modified)
  })
})

describe('duplicate code', () => {
  const contingentPath = urlpath()
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

  test('duplicate on create, expect 409', async () => {
    const auth = await generateAccessToken()
    const url = await contingentPath()
    const [request] = await requestProvider()

    const { contingent } = await createContingentFixture(request)

    const createResponse = await request
      .post(url)
      .auth(...auth)
      .send(contingent)
    expect(createResponse.status).toBe(409)
    expect(createResponse.body).toMatchObject({
      errors: { code: expect.anything() },
      links: expect.objectContaining({ read: expect.any(String) })
    })
  })
})
