'use strict'

const { invalidEmployee, validEmployee } = require('../data_helpers')
const { clearCollection } = require('../db_helpers')
const { generateAccessToken, requestFactory, servicePathProvider } = require('../http_request_helpers')

const { CollectionNameEnum } = require('../../../src/globals')

/** @type {() => (...path: any[]) => Promise<string>} */
const urlpath = () => {
  const base = servicePathProvider('employee')

  return (...path) => base().then(basepath => [basepath, ...path].join('/'))
}

/** @type {(request: any, options: { login: any, password?: string }) => Promise<string>} */
async function authUserFixture(request, options) {
  const url = await servicePathProvider('auth')()

  const response = await request.post(url).send(options)

  expect(response.status).toBe(200)
  expect(response.body).toMatchObject({
    accessToken: expect.any(String)
  })

  return response.body.accessToken
}

/** @type {(request: any) => Promise<{ user: User, create: string, delete: string, read: string, update: string }>} */
async function createEmployeeFixture(request) {
  const auth = await generateAccessToken({ admin: true })
  const doc = await validEmployee()
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

  return { user: doc, ...response.body.links }
}

/** @type {(request: any, url: string) => Promise<Dict<any>>} */
async function readEmployeeFixture(request, url) {
  const auth = await generateAccessToken({ admin: true })

  const response = await request
    .get(url)
    .auth(...auth)
    .send()

  expect(response.status).toBe(200)
  expect(response.body.doc).toMatchObject({
    id: expect.anything()
  })

  return response.body.doc
}

describe('access control', () => {
  const employeePath = urlpath()
  const requestProvider = requestFactory()

  beforeAll(async () => {
    await requestProvider()
  })

  afterAll(async () => {
    const [, teardown] = await requestProvider()

    await clearCollection(CollectionNameEnum.EMPLOYEE)
    await teardown()
  })

  test('unauthenticated create, expect 401', async () => {
    const url = await employeePath()
    const [request] = await requestProvider()

    const response = await request.post(url).send({})

    expect(response.status).toBe(401)
  })

  test('unauthenticated delete, expect 401', async () => {
    const url = await employeePath(1)
    const [request] = await requestProvider()

    const response = await request.delete(url).send()

    expect(response.status).toBe(401)
  })

  test('unauthenticated read, expect 401', async () => {
    const url = await employeePath(1)
    const [request] = await requestProvider()

    const response = await request.get(url).send({})

    expect(response.status).toBe(401)
  })

  test('unauthenticated update, expect 401', async () => {
    const url = await employeePath(1)
    const [request] = await requestProvider()

    const response = await request.put(url).send({})

    expect(response.status).toBe(401)
  })

  test('unauthorized create, expect 403', async () => {
    const auth = await generateAccessToken({ admin: false })
    const url = await employeePath()
    const [request] = await requestProvider()

    const response = await request
      .post(url)
      .auth(...auth)
      .send({})

    expect(response.status).toBe(403)
  })

  test('unauthorized delete, expect 403', async () => {
    const auth = await generateAccessToken({ admin: false })
    const url = await employeePath(1)
    const [request] = await requestProvider()

    const response = await request
      .delete(url)
      .auth(...auth)
      .send()

    expect(response.status).toBe(403)
  })

  test('unauthorized update, expect 403', async () => {
    const auth = await generateAccessToken({ admin: false })
    const url = await employeePath(1)
    const [request] = await requestProvider()

    const response = await request
      .put(url)
      .auth(...auth)
      .send({})

    expect(response.status).toBe(403)
  })
})

describe('employee.create', () => {
  const employeePath = urlpath()
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
    const auth = await generateAccessToken({ admin: true })
    const doc = invalidEmployee()
    const url = await employeePath()
    const [request] = await requestProvider()

    const response = await request
      .post(url)
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
    const auth = await generateAccessToken({ admin: true })
    const doc = await validEmployee()
    const url = await employeePath()
    const [request] = await requestProvider()

    const response = await request
      .post(url)
      .auth(...auth)
      .send(doc)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      links: expect.objectContaining({ read: expect.any(String) })
    })
  })
})

describe('employee.delete', () => {
  const employeePath = urlpath()
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
    const auth = await generateAccessToken({ admin: true })
    const url = await employeePath(1)
    const [request] = await requestProvider()

    const response = await request
      .delete(url)
      .auth(...auth)
      .send()

    expect(response.status).toBe(404)
  })

  test('delete existing document, expect 200', async () => {
    const auth = await generateAccessToken({ admin: true })
    const [request] = await requestProvider()

    const url = await createEmployeeFixture(request)
    await readEmployeeFixture(request, url.read)

    const deleteResponse = await request
      .delete(url.delete)
      .auth(...auth)
      .send()

    expect(deleteResponse.status).toBe(200)

    const notfoundResponse = await request
      .get(url.read)
      .auth(...auth)
      .send()
    expect(notfoundResponse.status).toBe(404)
  })

  test('delete own document, expect 200', async () => {
    const [request] = await requestProvider()

    const { user, ...url } = await createEmployeeFixture(request)
    const { id } = await readEmployeeFixture(request, url.read)
    const auth = await authUserFixture(request, { login: id, password: user.password })

    const deleteResponse = await request.delete(url.delete).auth(auth, { type: 'bearer' }).send()
    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body).toMatchObject({ accessToken: false })

    const unauthenticatedResponse = await request.get(url.read).auth(auth, { type: 'bearer' }).send()
    expect(unauthenticatedResponse.status).toBe(401)
  })
})

describe('employee.read', () => {
  const employeePath = urlpath()
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
    const url = await employeePath(1)
    const [request] = await requestProvider()

    const readResponse = await request
      .get(url)
      .auth(...auth)
      .send()

    expect(readResponse.status).toBe(404)
  })

  test('read existing document, expect 200', async () => {
    const auth = await generateAccessToken({ admin: true })
    const [request] = await requestProvider()

    const url = await createEmployeeFixture(request)

    const readResponse = await request
      .get(url.read)
      .auth(...auth)
      .send()
    expect(readResponse.status).toBe(200)
    expect(readResponse.body).toMatchObject({
      doc: expect.anything(),
      links: {
        create: expect.any(String),
        delete: expect.any(String),
        read: expect.any(String),
        update: expect.any(String)
      }
    })
  })
})

describe('employee.update', () => {
  const employeePath = urlpath()
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
    const auth = await generateAccessToken({ admin: true })
    const doc = await validEmployee()
    const url = await employeePath(1)
    const [request] = await requestProvider()

    const updateResponse = await request
      .put(url)
      .auth(...auth)
      .send(doc)

    expect(updateResponse.status).toBe(404)
  })

  test('update existing document, expect 200', async () => {
    const updateDoc = await validEmployee()
    const [request] = await requestProvider()
    // Remove password from update document
    delete updateDoc['password']

    const { user, ...url } = await createEmployeeFixture(request)
    const { id } = await readEmployeeFixture(request, url.read)
    const auth = await authUserFixture(request, { login: id, password: user.password })

    const updateResponse = await request.put(url.update).auth(auth, { type: 'bearer' }).send(updateDoc)
    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body).toMatchObject({
      accessToken: expect.any(String)
    })

    const updatedUser = await readEmployeeFixture(request, url.read)
    expect(updatedUser.modified > updatedUser.created).toBeTruthy()
  })
})

describe('duplicate employee', () => {
  const employeePath = urlpath()
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
    const auth = await generateAccessToken({ admin: true })
    const doc = await validEmployee()
    const url = await employeePath()
    const [request] = await requestProvider()

    const createResponse = await request
      .post(url)
      .auth(...auth)
      .send(doc)
    expect(createResponse.status).toBe(200)

    const duplicateResponse = await request
      .post(url)
      .auth(...auth)
      .send(doc)
    expect(duplicateResponse.status).toBe(409)
    expect(duplicateResponse.body).toMatchObject({
      errors: {
        birthdate: expect.any(String),
        firstname: expect.any(String),
        lastname: expect.any(String),
        middlename: expect.any(String)
      }
    })
  })

  test('duplicate on update, expect 409', async () => {
    const auth = await generateAccessToken({ admin: true })
    const [request] = await requestProvider()

    const { user: updateDoc } = await createEmployeeFixture(request)
    const url = await createEmployeeFixture(request)

    // Remove password from update document
    delete updateDoc['password']

    const updateResponse = await request
      .put(url.update)
      .auth(...auth)
      .send(updateDoc)
    expect(updateResponse.status).toBe(409)
    expect(updateResponse.body).toMatchObject({
      errors: expect.objectContaining({
        birthdate: expect.any(String),
        firstname: expect.any(String),
        lastname: expect.any(String),
        middlename: expect.any(String)
      })
    })
  })
})
