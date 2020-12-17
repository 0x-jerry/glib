import LRU from 'lru-cache'

export const noop = () => {}

export const cached = <T extends (arg?: any) => any>(func: T): T => {
  const cache = new LRU(100)

  // @ts-ignore
  return function (this: ThisType, arg: any) {
    if (cache.has(arg)) {
      return cache.get(arg)
    }

    const r = func.apply(this, arg)
    cache.set(arg, r)

    return r
  }
}

export function isObject(t: unknown): t is Object {
  return typeof t === 'object' && t !== null
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<any> ? T[P] : T[P] extends Object ? DeepPartial<T[P]> : T[P]
}

export function mergeDeep<T extends {}>(A: T, B: DeepPartial<T>): T {
  for (const key in A) {
    if (Object.prototype.hasOwnProperty.call(A, key)) {
      const va = A[key]
      const vb = B[key]
      if (!Array.isArray(va) && isObject(va) && !Array.isArray(vb) && isObject(vb)) {
        mergeDeep(va, vb as any)
      } else if (vb !== undefined) {
        A[key] = vb as any
      }
    }
  }

  return A
}
