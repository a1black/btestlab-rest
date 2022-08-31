'use strict'

const { responseObjectSet } = require('../../../src/libs/http_service_helpers')

describe('responseObjectSet', () => {
  test.each([
    ['null', null],
    ['undefined', undefined],
    ['false', false],
    ['blank string', '  '],
    ['empty Array', []],
    ['empty Object', {}],
    ['empty Map', new Map()],
    ['empty Set', new Set()]
  ])('value is %s, expect property not set', (_, value) => {
    expect(responseObjectSet({}, 'test', value)).not.toMatchObject({ test: expect.anything() })
  })

  test('set path, expect unpacked path', () => {
    expect(responseObjectSet({}, 'test.value', 1)).toMatchObject({ test: { value: 1 } })
  })

  test('value is Map object, expect plain object', () => {
    const map = new Map([
      ['one', 1],
      ['two', 2]
    ])

    expect(responseObjectSet({}, 'test', map)).toMatchObject({ test: { one: 1, two: 2 } })
  })

  test('value is Set object, expect an array', () => {
    expect(responseObjectSet({}, 'test', new Set([1, 2]))).toMatchObject({ test: expect.arrayContaining([1, 2]) })
  })
})
