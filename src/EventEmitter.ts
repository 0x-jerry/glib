const SymbolOnce = Symbol('once')

interface IEventListener {
  (...params: any[]): any

  [SymbolOnce]?: boolean
}

type EventName = number | string | symbol

type InnerEvents = {
  newListener(eventName: string, listener: Function): void
  removeListener(eventName: string, listener: Function): void
} & Record<EventName, IEventListener>

class EventRaw {
  static defaultMaxListener = 10

  private _maxListener: number

  protected _events: Record<string, Set<IEventListener>>

  constructor() {
    this._events = {}
    this._maxListener = EventRaw.defaultMaxListener || Infinity
  }

  private _checkMax(typeName?: string) {
    if (this._maxListener === Infinity) return

    const names = typeName === undefined ? this.eventNames() : [typeName]

    names.forEach((name) => {
      const count = this.count(name)

      if (count > this._maxListener) {
        console.warn('Max listener limit for ', typeName, count)
      }
    })
  }

  max(n?: number) {
    if (n === undefined) {
      return this._maxListener
    }

    this._maxListener = n || Infinity

    this._checkMax()
  }

  eventNames() {
    return Object.keys(this._events)
  }

  count(eventName: string) {
    return this.listeners(eventName).size
  }

  listeners(eventName: string) {
    if (!this._events[eventName]) {
      this._events[eventName] = new Set()
    }

    return this._events[eventName]
  }

  on(eventName: string, listener: IEventListener) {
    this.emit('newListener', eventName, listener)

    this.listeners(eventName).add(listener)
    this._checkMax(eventName)
  }

  once(eventName: string, listener: IEventListener) {
    listener[SymbolOnce] = true

    this.on(eventName, listener)
  }

  off(eventName: string, listener: IEventListener) {
    this.listeners(eventName).delete(listener)

    this.emit('removeListener', eventName, listener)
  }

  emit(eventName: string, ...args: any) {
    const events = this.listeners(eventName)

    for (const listener of events) {
      listener(...args)

      if (listener[SymbolOnce]) {
        listener[SymbolOnce] = false

        this.off(eventName, listener)
      }
    }
  }

  clear(eventName: string) {
    if (eventName !== undefined) {
      const listeners = this.listeners(eventName)

      listeners && listeners.forEach((l) => this.off(eventName, l))
    } else {
      this.eventNames().forEach((name) => this.clear(name as any))
    }
  }
}

interface EventEmitterConstructor<T extends InnerEvents = InnerEvents> {
  defaultMaxListener: number

  new (): EventEmitter<T>
}

export interface EventEmitter<T extends InnerEvents = InnerEvents, K extends keyof T = keyof T> {
  max(n?: number): void

  eventNames(): EventName[]

  count(eventName: K): number

  listeners(eventName: K): Set<T[K]>

  on(eventName: K, listener: T[K]): void

  off(eventName: K, listener: T[K]): void

  once(eventName: K, listener: T[K]): void

  emit(eventName: K, ...args: Parameters<T[K]>): void

  clear(eventName?: K): void
}

export const EventEmitter: EventEmitterConstructor = EventRaw as any
