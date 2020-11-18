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
