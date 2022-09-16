'use strict'

const { invalidLpu, validLpu } = require('../data_helpers')
const { clearCollection } = require('../db_helpers')
const { generateAccessToken, requestFactory, servicePathProvider } = require('../http_request_helpers')

const { CollectionNameEnum } = require('../../../src/globals')

/** @type {() => (...path: any[]) => Promise<string>} */
const urlpath = () => {
  const base = servicePathProvider('lpu')

  return (...path) => base().then(basepath => [basepath, ...path].join('/'))
}

/** @type {(request: any) => Promise<{ lpu: Partial<Collection.Lpu>, url: { create: string, delete: string, read: string, update: string }}>} */
async function createLpuFixture(request) {
  const auth = await generateAccessToken()
  const doc = await validLpu()
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

  return { lpu: doc, url: response.body.links }
}

/** @type {(request: any, url: string) => Promise<void>} */
async function deleteLpuFixture(request, url) {
  const auth = await generateAccessToken()

  const response = await request
    .delete(url)
    .auth(...auth)
    .send()
  expect(response.status).toBe(200)
}

describe('access control', () => {
  const lpuPath = urlpath()
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  test('unauthenticated create, expect 401', async () => {
    const doc = await validLpu()
    const url = await lpuPath()
    const [request] = await requestProvider()

    const response = await request.post(url).send(doc)
    expect(response.status).toBe(401)
  })

  test('unauthenticated read, expect 401', async () => {
    const url = await lpuPath('lpu')
    const [request] = await requestProvider()

    const response = await request.get(url).send()
    expect(response.status).toBe(401)
  })

  test('unauthenticated update, expect 401', async () => {
    const doc = await validLpu()
    const url = await lpuPath('lpu')
    const [request] = await requestProvider()

    const response = await request.put(url).send(doc)
    expect(response.status).toBe(401)
  })

  test('unauthenticated state update, expect 401', async () => {
    const url = await lpuPath('lpu')
    const [request] = await requestProvider()

    const response = await request.put(url).send({ state: true })
    expect(response.status).toBe(401)
  })
})

describe('lpu.create', () => {
  const lpuPath = urlpath()
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
    const auth = await generateAccessToken()
    const doc = invalidLpu()
    const url = await lpuPath()
    const [request] = await requestProvider()

    const createResponse = await request
      .post(url)
      .auth(...auth)
      .send(doc)
    expect(createResponse.status).toBe(400)
    expect(createResponse.body).toMatchObject({
      errors: expect.objectContaining({
        abbr: expect.any(String),
        opf: expect.any(String)
      })
    })
  })

  test('valid post data, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validLpu()
    const url = await lpuPath()
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

  test('lpu created deactivated, expect true', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { url } = await createLpuFixture(request)

    const readResponse = await request
      .get(url.read)
      .auth(...auth)
      .send()
    expect(readResponse.status).toBe(200)
    expect(readResponse.body.doc).toMatchObject({
      disabled: expect.any(Number)
    })
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
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { url } = await createLpuFixture(request)
    await deleteLpuFixture(request, url.delete)

    const notfoundResponse = await request
      .delete(url.delete)
      .auth(...auth)
      .send()
    expect(notfoundResponse.status).toBe(404)
  })
})

describe('lpu.read', () => {
  const lpuPath = urlpath()
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
    const url = await lpuPath('lpu')
    const [request] = await requestProvider()

    const readResponse = await request
      .get(url)
      .auth(...auth)
      .send()
    expect(readResponse.status).toBe(404)
  })

  test('read existing document, expect 200', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { url } = await createLpuFixture(request)

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

  test('read deleted document, expect 200', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { url } = await createLpuFixture(request)
    await deleteLpuFixture(request, url.delete)

    const readResponse = await request
      .get(url.read)
      .auth(...auth)
      .send()
    expect(readResponse.status).toBe(200)
    expect(readResponse.body).toMatchObject({
      doc: expect.anything(),
      links: expect.not.objectContaining({
        delete: expect.any(String),
        update: expect.any(String)
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

  test('update deleted document, expect 404', async () => {
    const auth = await generateAccessToken()
    const doc = await validLpu()
    const [request] = await requestProvider()

    const { url } = await createLpuFixture(request)
    await deleteLpuFixture(request, url.delete)

    const updateResponse = await request
      .put(url.update)
      .auth(...auth)
      .send(doc)
    expect(updateResponse.status).toBe(404)
  })

  test('update existing document, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validLpu()
    const [request] = await requestProvider()

    const { url } = await createLpuFixture(request)

    const updateResponse = await request
      .put(url.update)
      .auth(...auth)
      .send(doc)
    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body.links).toMatchObject({ read: expect.any(String) })
    expect(url.read).not.toEqual(updateResponse.body.links.read)
  })
})

describe('lpu.state', () => {
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

  test('update state of deleted document, expect 404', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { url } = await createLpuFixture(request)
    await deleteLpuFixture(request, url.delete)

    const notfoundResponse = await request
      .put(url.update)
      .auth(...auth)
      .send({ state: false })
    expect(notfoundResponse.status).toBe(404)
  })

  test('repeated state update, expect 200', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { url } = await createLpuFixture(request)

    const updateResponse = await request
      .put(url.update)
      .auth(...auth)
      .send({ state: false })
    expect(updateResponse.status).toBe(200)
  })
})

describe('duplicate lpu', () => {
  const lpuPath = urlpath()
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
    const auth = await generateAccessToken()
    const url = await lpuPath()
    const [request] = await requestProvider()

    const { lpu } = await createLpuFixture(request)

    const duplicateResponse = await request
      .post(url)
      .auth(...auth)
      .send(lpu)
    expect(duplicateResponse.status).toBe(409)
    expect(duplicateResponse.body).toMatchObject({
      errors: { abbr: expect.any(String) }
    })
  })

  test('duplicate on update, expect 409', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { lpu } = await createLpuFixture(request)
    const { url } = await createLpuFixture(request)

    const duplicateResponse = await request
      .put(url.update)
      .auth(...auth)
      .send(lpu)
    expect(duplicateResponse.status).toBe(409)
    expect(duplicateResponse.body).toMatchObject({
      errors: { abbr: expect.any(String) }
    })
  })
})
