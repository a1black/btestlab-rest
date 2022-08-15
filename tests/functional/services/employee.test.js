'use strict'

const { invalidEmployee, validEmployee } = require('../data_helpers')
const { clearCollection } = require('../db_helpers')
const { requestFactory, pathjoin, generateAccessToken } = require('../http_request_helpers')

const { CollectionNameEnum } = require('../../../src/globals')

/** @type {typeof pathjoin} */
const urlpath = (...parts) => pathjoin('/employee', ...parts)
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

  test('unauthorized update, expect 403', async () => {
    const auth = await generateAccessToken(false)
    const [request] = await requestProvider()
    const response = await request
      .put(fakepath)
      .auth(...auth)
      .send({})

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })
})

describe('employee.create', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EMPLOYEE)
  })

  test('invalid post data, expect 400', async () => {
    const auth = await generateAccessToken(true)
    const doc = invalidEmployee()
    const [request] = await requestProvider()
    const response = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      errors: expect.objectContaining({
        firstname: expect.any(String),
        lastname: expect.any(String),
        middlename: expect.any(String),
        birthdate: expect.any(String)
      })
    })
  })

  test('valid post data, expect 200', async () => {
    const auth = await generateAccessToken(true)
    const doc = await validEmployee()
    const [request] = await requestProvider()
    const response = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ id: expect.any(Number) })
  })
})

describe('employee.delete', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EMPLOYEE)
  })

  test('delete non-existing document, expect 404', async () => {
    const auth = await generateAccessToken(true)
    const [request] = await requestProvider()
    const response = await request
      .delete(fakepath)
      .auth(...auth)
      .send()

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('delete existing document, expect 200', async () => {
    const auth = await generateAccessToken(true)
    const doc = await validEmployee()
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
  })

  test('self delete, expect 200', async () => {
    const doc = await validEmployee()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...(await generateAccessToken(true)))
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const id = createRes.body.id
    const auth = await generateAccessToken({ admin: true, id })
    const deleteRes = await request
      .delete(urlpath(id))
      .auth(...auth)
      .send()
    expect(deleteRes.status).toBe(200)
  })
})

describe('employee.read', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EMPLOYEE)
  })

  test('read non-existing document, expect 404', async () => {
    const auth = await generateAccessToken()
    const [request] = await requestProvider()
    const response = await request
      .get(fakepath)
      .auth(...auth)
      .send()

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('read existing document, expect 200', async () => {
    const doc = await validEmployee()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...(await generateAccessToken(true)))
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const readRes = await request
      .get(urlpath(createRes.body.id))
      .auth(...(await generateAccessToken()))
      .send()

    expect(readRes.status).toBe(200)
    expect(readRes.body).toMatchObject({
      doc: expect.objectContaining({ id: createRes.body.id })
    })
  })
})

describe('employee.update', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EMPLOYEE)
  })

  test('update non-existing document, expect 404', async () => {
    const auth = await generateAccessToken(true)
    const doc = await validEmployee()
    const [request] = await requestProvider()
    const response = await request
      .put(fakepath)
      .auth(...auth)
      .send(doc)

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({ message: expect.any(String) })
  })

  test('update existing document, expect 200', async () => {
    const auth = await generateAccessToken(true)
    const doc = await validEmployee()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const updateRes = await request
      .put(urlpath(createRes.body.id))
      .auth(...auth)
      .send(doc)
    expect(updateRes.status).toBe(200)

    const readRes = await request
      .get(urlpath(createRes.body.id))
      .auth(...auth)
      .send()

    expect(readRes.status).toBe(200)
    expect(readRes.body).toMatchObject({
      doc: expect.objectContaining({
        created: expect.any(Number),
        modified: expect.any(Number)
      })
    })
    expect(readRes.body.doc.modified > readRes.body.doc.created).toBeTruthy()
  })

  test('self update, expect 200', async () => {
    const auth = await generateAccessToken(true)
    const doc = await validEmployee()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...(await generateAccessToken(true)))
      .send(doc)
    expect(createRes.status).toBe(200)
    expect(createRes.body).toMatchObject({ id: expect.anything() })

    const updateRes = await request
      .put(urlpath(createRes.body.id))
      .auth(...(await generateAccessToken({ id: createRes.body.id })))
      .send(doc)
    expect(updateRes.status).toBe(200)

    const readRes = await request
      .get(urlpath(createRes.body.id))
      .auth(...auth)
      .send()

    expect(readRes.status).toBe(200)
    expect(readRes.body).toMatchObject({
      doc: expect.objectContaining({
        created: expect.any(Number),
        modified: expect.any(Number)
      })
    })
    expect(readRes.body.doc.modified > readRes.body.doc.created).toBeTruthy()
  })
})

describe('duplicate employee', () => {
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()
    await teardown()
  })

  afterEach(async () => {
    await clearCollection(CollectionNameEnum.EMPLOYEE)
  })

  test('duplicate on create, expect 409', async () => {
    const auth = await generateAccessToken(true)
    const doc = await validEmployee()
    const [request] = await requestProvider()

    const createRes = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)
    expect(createRes.status).toBe(200)

    const response = await request
      .post(urlpath())
      .auth(...auth)
      .send(doc)

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      errors: {
        birthdate: expect.anything(),
        firstname: expect.anything(),
        lastname: expect.anything(),
        middlename: expect.anything()
      }
    })
  })

  test('duplicate on update, expect 409', async () => {
    const auth = await generateAccessToken(true)
    const firstDoc = await validEmployee()
    const secondDoc = await validEmployee()
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
    expect(secondCreateRes.status).toBe(200)
    expect(secondCreateRes.body).toMatchObject({ id: expect.anything() })

    const updateRes = await request
      .put(urlpath(secondCreateRes.body.id))
      .auth(...auth)
      .send(firstDoc)

    expect(updateRes.status).toBe(409)
    expect(updateRes.body).toMatchObject({
      errors: expect.objectContaining({
        birthdate: expect.anything(),
        firstname: expect.anything(),
        lastname: expect.anything(),
        middlename: expect.anything()
      })
    })
  })
})
