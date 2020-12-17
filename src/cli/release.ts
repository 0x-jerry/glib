import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import semver from 'semver'
import { prompt } from 'enquirer'
import execa from 'execa'
import { getPackage } from './utils'
import { noop } from '../utils'

const cwd = process.cwd()

const pkgJson = getPackage()
const currentVersion = pkgJson.version

const versionIncrements: semver.ReleaseType[] = ['patch', 'minor', 'major']

const inc = (i: semver.ReleaseType) => semver.inc(currentVersion, i)
const run = (bin: string, args: string[], opts: execa.Options = {}) => execa(bin, args, { stdio: 'inherit', ...opts })
const info = (msg: string) => console.log(chalk.cyan(msg))

interface ReleaseStepContext {
  version: string
  pkg: any
  hasScript(name: string): boolean
  info(msg: string): void
  run: typeof run
}

interface ReleaseStep {
  (ctx: ReleaseStepContext): Promise<void> | void
}

const updateVersion: ReleaseStep = (opt) => {
  info('\nUpdating the package version...')

  const pkgPath = path.join(cwd, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

  pkg.version = opt.version

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

const build: ReleaseStep = async (ctx) => {
  if (!ctx.hasScript('build')) return

  info('\nBuilding the package...')
  await run('yarn', ['build'])
}

const generateReleaseNote: ReleaseStep = async (ctx) => {
  if (!ctx.hasScript('changelog')) return

  info('\nGenerate release note...')
  const mdContent = ['<!-- Auto generate by `./scripts/release.js` -->']

  const changelogPath = path.join(cwd, 'CHANGELOG.md')
  const oldContent = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, { encoding: 'utf-8' }) : ''

  // Generate the changelog.
  await run('yarn', ['changelog'])

  const newContent = fs.readFileSync(changelogPath, { encoding: 'utf-8' })

  mdContent.push(newContent.slice(0, newContent.length - oldContent.length).trim())

  const releaseNotePath = path.join(cwd, 'release-note.md')
  fs.writeFileSync(releaseNotePath, mdContent.join('\n'), { encoding: 'utf-8' })
}

const commit: ReleaseStep = async (ctx) => {
  info('\nCommitting changes...')
  await run('git', ['add', '-A'])
  await run('git', ['commit', '-m', `release: v${ctx.version}`])
}

const push: ReleaseStep = async (ctx) => {
  info('\nPushing to GitHub...')
  await run('git', ['tag', `v${ctx.version}`])
  await run('git', ['push', 'origin', `refs/tags/v${ctx.version}`])
  await run('git', ['push'])
}

const test: ReleaseStep = async (ctx) => {
  if (!ctx.hasScript('test')) return

  info('\nTesting...')
  await run('yarn', ['test'])
}

export interface StepOption {
  test: boolean
  build: boolean
  changelog: boolean
}

export interface ReleaseOption {
  beforeBuild: ReleaseStep
  afterBuild: ReleaseStep
  afterDone: ReleaseStep
  steps: Partial<StepOption>
}

export async function release(option: Partial<ReleaseOption> = {}) {
  const targetVersion: string = await promptReleaseVersion()

  const defaultOption: ReleaseOption = {
    beforeBuild: noop,
    afterBuild: noop,
    afterDone: noop,
    steps: {
      test: true,
      build: true,
      changelog: true
    }
  }

  const { steps } = (option = Object.assign(defaultOption, option))

  const stepActions: (ReleaseStep | undefined | false)[] = [
    updateVersion,
    steps.test && test,
    option.beforeBuild,
    steps.build && build,
    option.afterBuild,
    steps.changelog && generateReleaseNote,
    commit,
    push,
    option.afterDone
  ]

  const stepCtx: ReleaseStepContext = {
    version: targetVersion,
    pkg: pkgJson,
    hasScript(scriptName: string) {
      return !!pkgJson.scripts?.[scriptName]
    },
    info,
    run
  }

  for (const step of stepActions) {
    if (step) {
      await step(stepCtx)
    }
  }
}

async function promptReleaseVersion() {
  let targetVersion: string = ''

  const opt: { release: string } = await prompt({
    type: 'select',
    name: 'release',
    message: 'Select release type',
    choices: versionIncrements.map((i) => `${i} (${inc(i)})`).concat(['custom'])
  })

  if (opt.release === 'custom') {
    targetVersion = ((await prompt({
      type: 'input',
      name: 'version',
      message: 'Input custom version',
      initial: currentVersion
    })) as { version: string }).version
  } else {
    targetVersion = opt.release.match(/\((.*)\)/)![1]
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`Invalid target version: ${targetVersion}`)
  }
  return targetVersion
}
