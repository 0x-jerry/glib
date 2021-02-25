import path from 'path'
import fs from 'fs'

export function getPackage() {
  const cwd = process.cwd()
  const pkgPath = path.join(cwd, 'package.json')

  try {
    return fsRequest(pkgPath)
  } catch (error) {
    throw new Error('Can not find package.json in: ' + cwd)
  }
}

export function fsRequest(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Can not find file: ' + filePath)
  }

  return require(filePath)
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

export function isObject(t: unknown): t is Object {
  return typeof t === 'object' && t !== null
}

export const noop = () => {}
