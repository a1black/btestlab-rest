'use strict'

const dateutils = require('../../../src/libs/date_utils')

describe('dateutils.dateMidnight()', () => {
  test.each([NaN, Number.MAX_SAFE_INTEGER, 'invalid date', new Date('invalid')])(
    'invalid argument (%s), raises TypeError',
    value => {
      // @ts-ignore
      expect(() => dateutils.dateMidnight(value)).toThrowError(TypeError)
    }
  )

  test.each([undefined, null, Date.now(), 'now', new Date()])('valid argument (%s), expect Date', value => {
    const expected = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'

    // @ts-ignore
    expect(dateutils.dateMidnight(value).toISOString()).toBe(expected)
  })
})

describe('dateutils.toShortISOString', () => {
  test('invalid date, expect undefined', () => {
    expect(dateutils.toShortISOString(new Date('invalid'))).toBeUndefined()
  })

  test('not Date instance, expect undefined', () => {
    expect(dateutils.toShortISOString('2022-01-01T10:10:10.000Z')).toBeUndefined()
  })
})
