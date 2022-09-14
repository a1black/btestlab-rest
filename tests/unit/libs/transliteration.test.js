'use strict'

const translit = require('../../../src/libs/transliteration')

test('empty string, expect unchanged', () => {
  expect(translit('')).toBe('')
})

test('latin string, expect unchanged', () => {
  const test = 'string containing latin latters'
  expect(translit(test)).toBe(test)
})

test('capitalized input, expect capitalized output', () => {
  const test = 'Привет МИР!'
  const expected = 'Privet MIR!'

  expect(translit(test)).toBe(expected)
})

describe('ru translit', () => {
  test('alphabet without special cases', () => {
    const ru = 'абвгдеёжзийклмнопрстуфхчшщыэюя'
    const expected = 'abvgdeyozhzijklmnoprstufxchshshhyeyuya'

    expect(translit(ru)).toBe(expected)
  })

  test('ъ, expect empty string', () => {
    expect(translit('ъ')).toBe('')
  })

  test('ь, expect empty string', () => {
    expect(translit('ь')).toBe('')
  })

  test.each([
    ['цирк', 'cirk'],
    ['цех', 'cex'],
    ['цёколь', 'cyokol'],
    ['цй', 'cj'],
    ['цой', 'czoj'],
    ['цц', 'czcz'],
    ['цци', 'czci']
  ])('ц -> cz or c: %s, expect %s', (test, expected) => {
    expect(translit(test)).toBe(expected)
  })
})
