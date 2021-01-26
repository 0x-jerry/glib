import { isFunction } from './utils'

export interface Rule<T> {
  condition: boolean | (() => boolean)
  result: T | (() => T)
}

export function Rule<T>(condition: boolean | (() => boolean), result: (() => T) | T) {
  return {
    condition,
    result
  }
}

export function RuleExecutor<T>(rules: Rule<T>[], defaultValue?: T | (() => T)) {
  for (const rule of rules) {
    if (getValue(rule.condition)) {
      return getValue(rule.result)
    }
  }

  return defaultValue ? getValue(defaultValue) : null
}

function getValue<T>(v: T | (() => T)): T {
  return isFunction(v) ? v() : v
}
