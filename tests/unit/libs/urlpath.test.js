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

describe('repeated path separators', () => {
  test('path is a string, expect remove duplicated separetors', () => {
    const test = '//root/path///repetitive/separator//'
    const expected = '/root/path/repetitive/separator'

    expect(urlpath(test)).toBe(expected)
  })

  test('path is an array, expect remove duplicated separetors', () => {
    const test = ['', 'root', 'path', '', 'repetitive', '', '', 'separator', '']
    const expected = '/root/path/repetitive/separator'

    expect(urlpath(test)).toBe(expected)
  })
})

describe('path argument', () => {
  test.each([undefined, null, { value: 'value' }, ['value'], new Set(), new Map()])(
    'invalid type of item in path array, raises TypeError',
    value => {
      // @ts-ignore
      expect(() => urlpath(['root', value])).toThrowError(TypeError)
    }
  )

  test.each([undefined, null, { value: 'value' }, new Set(), new Map()])(
    'invalid argument type, raises TypeError',
    value => {
      // @ts-ignore
      expect(() => urlpath(value)).toThrowError(TypeError)
    }
  )

  test.each([
    ['string', '/string'],
    [1, '/1'],
    [true, '/true'],
    [new Number(1), '/1'],
    [new String('string'), '/string']
  ])('valid argument type, expect URL path', (value, expected) => {
    // @ts-ignore
    expect(urlpath(value)).toBe(expected)
    // @ts-ignore
    expect(urlpath([value])).toBe(expected)
  })
})

describe('query argument', () => {
  test.each([undefined, null, { value: 'value' }, new Set(), new Map()])(
    'invalid type of parameter value, expect parameter ignored',
    value => {
      // @ts-ignore
      expect(urlpath('/path', { test: value })).toBe('/path')
    }
  )

  test.each([undefined, null, { value: 'value' }, ['value'], new Set(), new Map()])(
    'invalid type of item in array of parameter values, expect ignore item',
    value => {
      // @ts-ignore
      expect(urlpath('/path', { test: [value] })).toBe('/path')
    }
  )
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
