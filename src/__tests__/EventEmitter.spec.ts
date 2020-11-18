import { EventEmitter } from '../EventEmitter'

describe('EventEmitter', () => {
  let e: EventEmitter

  beforeEach(() => {
    e = new EventEmitter()
  })

  it('on', () => {
    const fn = jest.fn()
    e.on('test', fn)

    const listeners = e.listeners('test')
    expect([...listeners][0]).toBe(fn)
  })

  it('off', () => {
    const fn = () => {}

    e.on('testoff', fn)
    let listeners = e.listeners('testoff')

    expect([...listeners][0]).toBe(fn)
    expect(listeners.size).toBe(1)

    e.off('testoff', fn)
    listeners = e.listeners('testoff')
    expect(listeners.size).toBe(0)
  })

  it('once', () => {
    const fn = jest.fn()
    e.once('test', fn)

    expect(fn).toBeCalledTimes(0)

    e.emit('test')
    expect(fn).toBeCalledTimes(1)

    expect(e.count('test')).toBe(0)
  })

  it('emit', (done) => {
    const fn = jest.fn()
    e.on('test', fn)

    expect(fn).toBeCalledTimes(0)

    e.emit('test')
    expect(fn).toBeCalledTimes(1)

    e.on('test1', (...args) => {
      expect(args).toEqual([1, 2, 3])
      done()
    })

    e.emit('test1', 1, 2, 3)
  })

  it('clear', () => {
    const fn = jest.fn()

    e.on('test', fn)
    e.on('test1', fn)
    e.on('test2', fn)

    expect(e.listeners('test').size).toBe(1)
    expect(e.listeners('test1').size).toBe(1)
    expect(e.listeners('test2').size).toBe(1)
    e.clear()

    expect(e.listeners('test').size).toBe(0)
    expect(e.listeners('test1').size).toBe(0)
    expect(e.listeners('test2').size).toBe(0)
  })
})
