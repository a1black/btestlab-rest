'use strict'

const urlpath = require('../../../src/libs/urlpath')

describe('empty function arguments', () => {
  test('path and query are empty, expect URL root path', () => {
    expect(urlpath('', {})).toBe('/')
  })

  test('only path is empty, expect query string', () => {
    expect(urlpath('', { test: 'value' })).toBe('?test=value')
  })

  test('only query is empty, expect URL path', () => {
    expect(urlpath('/path')).toBe('/path')
  })
})

describe('path argument', () => {
  test('nested arrays in path argument, raises TypeError', () => {
    // @ts-ignore
    expect(() => urlpath(['root', ['path']])).toThrowError(TypeError)
  })

  test.each([
    ['string', '/string'],
    [1, '/1'],
    [true, '/true'],
    [new Number(1), '/1'],
    [new String('string'), '/string']
  ])('valid argument type (%s), expect URL path "%s"', (test, expected) => {
    // @ts-ignore
    expect(urlpath(test)).toBe(expected)
    // @ts-ignore
    expect(urlpath([test])).toBe(expected)
  })
})

describe('query argument', () => {
  test('nested arrays in query parameter value, expect ignore nested values', () => {
    // @ts-ignore
    expect(urlpath('/path', { a: [1, [2]] })).toBe('/path?a=1')
  })
})

test.each([
  '//relative/url//path/test//',
  ['', '', 'relative', 'url', '', '', 'path', 'test', ''],
  ['//relative/url/', '', 'path//test//']
])('exessive path separation, expect clean path', test => {
  const expected = '/relative/url/path/test'

  expect(urlpath(test)).toBe(expected)
})

test('primitive types test, expect relative URL', () => {
  expect(urlpath(['root', 'path'], { a: [0, 1, 2], n: 0, s: 'value' })).toBe('/root/path?a=0&a=1&a=2&n=0&s=value')
})

test('alternative types test, expect relative URL', () => {
  expect(
    // @ts-ignore
    urlpath([new String('root'), new String('path')], { a: [new Number(0), new Number(1)], s: new String('value') })
  ).toBe('/root/path?a=0&a=1&s=value')
})
