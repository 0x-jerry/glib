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
