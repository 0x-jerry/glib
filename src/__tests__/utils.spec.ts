import { mergeDeep } from '../utils'

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
})
