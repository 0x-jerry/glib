import { mergeDeep, x } from '../utils'

describe('deep merge', () => {
  it('plain object', () => {
    expect(mergeDeep({ a: 3, b: 4 }, { a: 5 })).toEqual({ a: 5, b: 4 })
  })

  it('deep object', () => {
    expect(
      mergeDeep(
        {
          a: 3,
          b: 4,
          c: {
            a: 3
          }
        },
        {
          a: 5,
          c: {
            a: 10
          }
        }
      )
    ).toEqual({
      a: 5,
      b: 4,
      c: {
        a: 10
      }
    })
  })

  it('x', () => {
    const percentage = (s: number) =>
      x(s)
        .next((s) => s.toString())
        .next((s) => s.padStart(2))
        .next((s) => s + '%')
        .done()

    expect(percentage(10)).toBe('10%')
  })
})
