'use strict'

const httputils = require('../../../src/libs/http_utils')

describe('httputils.responseObjectSet()', () => {
  test.each([
    ['null', null],
    ['undefined', undefined],
    ['false', false],
    ['blank string', '  '],
    ['empty Array', []],
    ['empty Object', {}],
    ['empty Map', new Map()],
    ['empty Set', new Set()]
  ])('empty property value (%s), expect target object unchanged', (_, value) => {
    expect(httputils.responseObjectSet({}, 'test', value)).not.toMatchObject({ test: expect.anything() })
  })

  test('value is Map object, expect plain object', () => {
    const map = new Map([
      ['one', 1],
      ['two', 2]
    ])

    expect(httputils.responseObjectSet({}, 'test', map)).toMatchObject({ test: { one: 1, two: 2 } })
  })

  test('value is Set object, expect an array', () => {
    const set = new Set([1, 2])

    expect(httputils.responseObjectSet({}, 'test', set)).toMatchObject({
      test: expect.arrayContaining([1, 2])
    })
  })
})
