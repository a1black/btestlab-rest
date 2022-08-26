'use strict'

const { isObject, objectSet, objectSetShallow } = require('../../../src/libs/functional_helpers')

describe('isObject', () => {
  test('argumnt is plain object, expect true', () => {
    expect(isObject({ test: 'test' })).toBe(true)
  })

  test.each([
    undefined,
    null,
    true,
    1,
    'string',
    () => 'function',
    ['array'],
    Object.assign(Object.create({}), { type: 'prototyped object' }),
    new (class {
      constructor() {
        this.type = 'class'
      }
    })()
  ])('%s, expect false', value => {
    expect(isObject(value)).toBe(false)
  })
})

describe('objectSet', () => {
  test('path is dot separeted string, expect success', () => {
    const obj = {}
    const path = 'level1.level2'
    const value = 'value'
    objectSet(obj, path, value)

    expect(obj).toHaveProperty(path, value)
  })

  test('path is an array, expect success', () => {
    const obj = {}
    const path = ['level1', 'level2']
    const value = 'value'
    objectSet(obj, path, 'value')

    expect(obj).toHaveProperty(path, value)
  })

  test('path is an array of numbers, expect object with numeric keys', () => {
    const obj = {}
    const path = [1, 2]
    const value = 'value'
    objectSet(obj, path, value)

    expect(obj).toHaveProperty(path.join('.'), value)
  })

  test('override object in path with value of base type, expect success', () => {
    const obj = { level1: { level2: { level3: 'value' } } }
    const path = 'level1.level2'
    const value = 'value'
    objectSet(obj, path, value)

    expect(obj).toHaveProperty(path, value)
  })

  test('link in path is not plain object, expect target object unchanged', () => {
    const obj = { level1: { level2: 'value' } }
    objectSet(obj, 'level1.level2.level3', 'value')

    expect(obj).toHaveProperty('level1.level2', 'value')
  })
})

describe('objectSetShallow', () => {
  test('Null property value, expect property not set', () => {
    const obj = { value: 'value' }
    objectSetShallow(obj, 'null', null)
    objectSetShallow(obj, 'undefined', undefined)

    expect(Object.keys(obj).length).toBe(1)
  })

  test('property is path, expect no path traversl', () => {
    const obj = {}
    objectSetShallow(obj, 'level1.level2', 'value')

    expect(obj).toMatchObject({ 'level1.level2': 'value' })
  })
})
