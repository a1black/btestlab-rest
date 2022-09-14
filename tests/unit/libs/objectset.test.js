'use strict'

const objectSet = require('../../../src/libs/objectset')

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

test('override property value, expect success', () => {
  const obj = { level1: { level2: { level3: 'value' } } }
  const path = 'level1.level2'
  const value = 'value'
  objectSet(obj, path, value)

  expect(obj).toHaveProperty(path, value)
})

test('impossible property path, expect target object unchanged', () => {
  const obj = { level1: { level2: 'value' } }
  objectSet(obj, 'level1.level2.level3', 'value')

  expect(obj).toHaveProperty('level1.level2', 'value')
})

test('attempt property with null value, expect target object unchanged', () => {
  const obj = {}
  objectSet(obj, 'level1.level2', undefined)

  expect(Object.keys(obj).length).toBe(0)
})

test('attempt to update property to null, expect target object unchanged', () => {
  const obj = { level1: { level2: { level3: 'value' } } }
  const path = 'level1.level2'
  objectSet(obj, path, undefined)

  expect(obj).toHaveProperty(path)
})
