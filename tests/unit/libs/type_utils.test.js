'use strict'

const typeutils = require('../../../src/libs/type_utils')

describe('typeutils.isObject', () => {
  test('argumnt is plain object, expect true', () => {
    expect(typeutils.isObject({ test: 'test' })).toBe(true)
  })

  test.each([
    undefined,
    null,
    true,
    1,
    'string',
    new Boolean(true),
    new Number(1),
    new String('string'),
    () => 'function',
    ['array'],
    Object.assign(Object.create({}), { type: 'prototyped object' }),
    new (class {
      constructor() {
        this.type = 'class'
      }
    })()
  ])('%s, expect false', value => {
    expect(typeutils.isObject(value)).toBe(false)
  })
})
