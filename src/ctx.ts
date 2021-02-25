import chalk from 'chalk'
import execa from 'execa'
import { getPackage } from './utils'

export const cliCtx = {
  pkg: getPackage(),
  run(bin: string, args: string[], opts: execa.Options = {}) {
    return execa(bin, args, { stdio: 'inherit', ...opts })
  },
  info(...msgs: string[]) {
    console.log(chalk.cyan(...msgs))
  },
  hasScript(name: string) {
    return !!cliCtx.pkg?.scripts?.[name]
  }
}

export type CliContext = typeof cliCtx
