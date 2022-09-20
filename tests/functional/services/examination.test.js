'use strict'

/**
 * @typedef {Collection.Examination<TestResult.Hiv>} ExaminationDoc
 * @typedef {{ create: string, delete: string, read: string, update: string }} ExaminationLinks
 */

const { validExamination } = require('../data_helpers')
const { clearCollection } = require('../db_helpers')
const { generateAccessToken, requestFactory, servicePathProvider } = require('../http_request_helpers')

const { CollectionNameEnum } = require('../../../src/globals')

/** @type {() => (...path: any[]) => Promise<string>} */
const urlpath = () => {
  const base = servicePathProvider('examination')

  return (...path) => base().then(basepath => [basepath, ...path].join('/'))
}

/** @type {(request: any) => Promise<{ examination: Partial<ExaminationDoc>, url: ExaminationLinks }>} */
async function createExaminationFixture(request) {
  const auth = await generateAccessToken()
  const doc = await validExamination()
  const url = await urlpath()(doc.type)

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

  return { examination: doc, url: response.body.links }
}

/** @type {(request: any, url: string) => Promise<void>} */
async function deleteExaminationFixture(request, url) {
  const auth = await generateAccessToken()

  const response = await request
    .delete(url)
    .auth(...auth)
    .send()
  expect(response.status).toBe(200)
}

describe('access control', () => {
  const examinationPath = urlpath()
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  test('unauthenticated create, expect 401', async () => {
    const doc = await validExamination()
    const url = await examinationPath(doc.type)
    const [request] = await requestProvider()

    const response = await request.post(url).send(doc)
    expect(response.status).toBe(401)
  })

  test('unauthenticated delete, expect 401', async () => {
    const doc = await validExamination()
    const url = await examinationPath(doc.type, doc._date, doc.number)
    const [request] = await requestProvider()

    const response = await request.delete(url).send()
    expect(response.status).toBe(401)
  })

  test('unauthenticated read, expect 401', async () => {
    const doc = await validExamination()
    const url = await examinationPath(doc.type, doc._date, doc.number)
    const [request] = await requestProvider()

    const response = await request.get(url).send()
    expect(response.status).toBe(401)
  })

  test('unauthenticated update, expect 401', async () => {
    const doc = await validExamination()
    const url = await examinationPath(doc.type, doc._date, doc.number)
    const [request] = await requestProvider()

    const response = await request.put(url).send(doc)
    expect(response.status).toBe(401)
  })
})

describe('examination.create', () => {
  const examinationPath = urlpath()
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EXAMINATION)
  })

  test('invalid post data, expect 400', async () => {
    const { type } = await validExamination()

    const auth = await generateAccessToken()
    const url = await examinationPath(type)
    const [request] = await requestProvider()

    const createResponse = await request
      .post(url)
      .auth(...auth)
      .send({})
    expect(createResponse.status).toBe(400)
    expect(createResponse.body).toMatchObject({
      errors: expect.anything()
    })
  })

  test('valid post data, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validExamination()
    const url = await examinationPath(doc.type)
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

describe('examination.delete', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EXAMINATION)
  })

  test('delete document, expect 200', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { url } = await createExaminationFixture(request)

    const deleteResponse = await request
      .delete(url.delete)
      .auth(...auth)
      .send()
    expect(deleteResponse.status).toBe(200)

    const notfoundResponse = await request
      .delete(url.delete)
      .auth(...auth)
      .send()
    expect(notfoundResponse.status).toBe(404)
  })
})

describe('examination.list', () => {
  const examinationPath = urlpath()
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EXAMINATION)
  })

  test('list documents, expect 200', async () => {
    const { _date, type } = await validExamination()
    const auth = await generateAccessToken()
    const path = await examinationPath(type, _date)
    const [request] = await requestProvider()

    const { url } = await createExaminationFixture(request)
    await createExaminationFixture(request)
    await createExaminationFixture(request)
    await deleteExaminationFixture(request, url.delete)

    const listResponse = await request
      .get(path)
      .auth(...auth)
      .send()
    expect(listResponse.status).toBe(200)
    expect(listResponse.body).toMatchObject({
      defaults: { accounted: expect.any(String), type },
      list: expect.any(Array),
      links: {
        create: expect.any(String),
        delete: expect.any(String),
        read: expect.any(String),
        update: expect.any(String)
      }
    })
    expect(listResponse.body.list).toHaveLength(2)
  })
})

describe('examination.read', () => {
  const examinationPath = urlpath()
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EXAMINATION)
  })

  test('read non-existing document, expect 404', async () => {
    const { _date, number, type } = await validExamination()
    const auth = await generateAccessToken()
    const url = await examinationPath(type, _date, number)
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

    const { url } = await createExaminationFixture(request)

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

    const { url } = await createExaminationFixture(request)
    await deleteExaminationFixture(request, url.delete)

    const readResponse = await request
      .get(url.read)
      .auth(...auth)
      .send()
    expect(readResponse.status).toBe(200)
    expect(readResponse.body).toMatchObject({
      doc: expect.objectContaining({ deleted: expect.anything() }),
      links: expect.objectContaining({
        create: expect.any(String),
        read: expect.any(String)
      })
    })
    expect(readResponse.body.links).not.toMatchObject({
      delete: expect.anything(),
      update: expect.anything()
    })
  })
})

describe('examination.update', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EXAMINATION)
  })

  test('update deleted document, expect 404', async () => {
    const auth = await generateAccessToken()
    const doc = await validExamination()
    const [request] = await requestProvider()

    const { url } = await createExaminationFixture(request)
    await deleteExaminationFixture(request, url.delete)

    const updateResponse = await request
      .put(url.update)
      .auth(...auth)
      .send(doc)
    expect(updateResponse.status).toBe(404)
  })

  test('update existing document, expect 200', async () => {
    const auth = await generateAccessToken()
    const doc = await validExamination()
    const [request] = await requestProvider()

    const { url } = await createExaminationFixture(request)

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
      modified: expect.anything(),
      number: expect.anything()
    })
    expect(readResponse.body.doc.number).not.toEqual(doc.number)
  })
})

describe('duplicate examination', () => {
  const examinationPath = urlpath()
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EXAMINATION)
  })

  test('duplicate on create, expect 409', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()

    const { examination, url } = await createExaminationFixture(request)
    const path = await examinationPath(examination.type)

    const duplicateResponse = await request
      .post(path)
      .auth(...auth)
      .send(examination)
    expect(duplicateResponse.status).toBe(409)
    expect(duplicateResponse.body).toMatchObject({
      doc: expect.anything(),
      errors: {
        accounted: expect.any(String),
        number: expect.any(String),
        type: expect.any(String)
      },
      links: url
    })
  })
})
