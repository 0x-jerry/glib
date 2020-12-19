import commander from 'commander'
import path from 'path'
import fs from 'fs'
import { release, ReleaseOption } from './release'
import { fsRequest } from './utils'

export interface UserOption {
  release?: ReleaseOption
}

const program = commander

function version() {
  return fsRequest(path.join(__dirname, '../../package.json')).version
}

program
  .version(version())
  // release
  .command('release')
  .description('Release a new version.')
  .action(actionWrapper(release, 'release'))

program.parse(process.argv)

function actionWrapper(func: Function, key: keyof UserOption) {
  const opt: UserOption = getConfig()

  return () => func(opt[key])
}

function getConfig() {
  const cwd = process.cwd()
  const confPath = path.join(cwd, 'glib.config.js')
  if (!fs.existsSync(confPath)) {
    return {}
  }

  return require(confPath)
}
