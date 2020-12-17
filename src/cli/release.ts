import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import semver from 'semver'
import { prompt } from 'enquirer'
import execa from 'execa'
import { getPackage } from './utils'
const currentVersion = require('../package.json').version

const versionIncrements: semver.ReleaseType[] = ['patch', 'minor', 'major']

const inc = (i: semver.ReleaseType) => semver.inc(currentVersion, i)
const run = (bin: string, args: string[], opts: execa.Options = {}) => execa(bin, args, { stdio: 'inherit', ...opts })
const info = (msg: string) => console.log(chalk.cyan(msg))

interface ReleaseStepOption {
  version: string
  pkg: any
}

interface ReleaseStep {
  (opt: ReleaseStepOption): Promise<void> | void
}

const updateVersion: ReleaseStep = (opt) => {
  info('\nUpdating the package version...')

  const pkgPath = path.resolve(path.resolve(__dirname, '..'), 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

  pkg.version = opt.version

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

const build: ReleaseStep = async (opt) => {
  if (!opt.pkg.scripts?.build) {
    return
  }

  info('\nBuilding the package...')
  await run('yarn', ['build'])
}

const generateReleaseNote: ReleaseStep = async (opt) => {
  if (!opt.pkg.scripts?.changelog) {
    return
  }

  info('\nGenerate release note...')
  const mdContent = ['<!-- Auto generate by `./scripts/release.js` -->']

  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
  const oldContent = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, { encoding: 'utf-8' }) : ''

  // Generate the changelog.
  await run('yarn', ['changelog'])

  const newContent = fs.readFileSync(changelogPath, { encoding: 'utf-8' })

  mdContent.push(newContent.slice(0, newContent.length - oldContent.length).trim())

  const releaseNotePath = path.join(process.cwd(), 'release-note.md')
  fs.writeFileSync(releaseNotePath, mdContent.join('\n'), { encoding: 'utf-8' })
}

const commit: ReleaseStep = async (opt) => {
  info('\nCommitting changes...')
  await run('git', ['add', '-A'])
  await run('git', ['commit', '-m', `release: v${opt.version}`])
}

const push: ReleaseStep = async (opt) => {
  info('\nPushing to GitHub...')
  await run('git', ['tag', `v${opt.version}`])
  await run('git', ['push', 'origin', `refs/tags/v${opt.version}`])
  await run('git', ['push'])
}

export interface ReleaseOption {
  beforeBuild: ReleaseStep
  afterBuild: ReleaseStep
  afterDone: ReleaseStep
}

export async function release(option: Partial<ReleaseOption> = {}) {
  const pkg = getPackage()

  option = Object.assign(
    {
      afterBuild: generateReleaseNote
    },
    option
  )

  const targetVersion: string = await promptReleaseVersion()

  const steps: (ReleaseStep | undefined)[] = [
    updateVersion,
    option.beforeBuild,
    build,
    option.afterBuild,
    commit,
    push,
    option.afterDone
  ]

  const stepOpt: ReleaseStepOption = {
    version: targetVersion,
    pkg
  }

  for (const step of steps) {
    if (step) {
      await step(stepOpt)
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
