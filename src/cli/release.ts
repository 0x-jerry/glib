import fs from 'fs'
import path from 'path'
import semver from 'semver'
import { prompt } from 'enquirer'
import { mergeDeep, noop } from '../utils'
import { CliContext, cliCtx } from './ctx'

const cwd = process.cwd()

const currentVersion = cliCtx.pkg.version

const versionIncrements: semver.ReleaseType[] = ['patch', 'minor', 'major']

const inc = (i: semver.ReleaseType) => semver.inc(currentVersion, i)

interface ReleaseStepContext extends CliContext {
  version: string
}

interface ReleaseStep {
  (ctx: ReleaseStepContext): Promise<void> | void
}

const updateVersion: ReleaseStep = (ctx) => {
  ctx.info('\nUpdating the package version...')

  const pkgPath = path.join(cwd, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

  pkg.version = ctx.version

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

const build: ReleaseStep = async (ctx) => {
  if (!ctx.hasScript('build')) return

  ctx.info('\nBuilding the package...')
  await ctx.run('yarn', ['build'])
}

const generateReleaseNote: ReleaseStep = async (ctx) => {
  if (!ctx.hasScript('changelog')) return

  ctx.info('\nGenerate release note...')
  const mdContent = ['<!-- Auto generate by `./scripts/release.js` -->']

  const changelogPath = path.join(cwd, 'CHANGELOG.md')
  const oldContent = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, { encoding: 'utf-8' }) : ''

  // Generate the changelog.
  await ctx.run('yarn', ['changelog'])

  const newContent = fs.readFileSync(changelogPath, { encoding: 'utf-8' })

  mdContent.push(newContent.slice(0, newContent.length - oldContent.length).trim())

  const releaseNotePath = path.join(cwd, 'release-note.md')
  fs.writeFileSync(releaseNotePath, mdContent.join('\n'), { encoding: 'utf-8' })
}

const commit: ReleaseStep = async (ctx) => {
  ctx.info('\nCommitting changes...')
  await ctx.run('git', ['add', '-A'])
  await ctx.run('git', ['commit', '-m', `release: v${ctx.version}`])
}

const push: ReleaseStep = async (ctx) => {
  ctx.info('\nPushing to GitHub...')
  await ctx.run('git', ['tag', `v${ctx.version}`])
  await ctx.run('git', ['push', 'origin', `refs/tags/v${ctx.version}`])
  await ctx.run('git', ['push'])
}

const test: ReleaseStep = async (ctx) => {
  if (!ctx.hasScript('test')) return

  ctx.info('\nTesting...')
  await ctx.run('yarn', ['test'])
}

const publishToNpm: ReleaseStep = async (ctx) => {
  ctx.info('\nPublishing to npm...')
  await ctx.run('yarn', ['publish', '--new-version', ctx.version])
}

export interface StepOption {
  /**
   * 是否执行 `yarn test`
   * @default true
   */
  test: boolean
  /**
   * 是否执行 `yarn build`
   * @default true
   */
  build: boolean
  /**
   * 是否执行 `yarn changelog`
   * @default true
   */
  changelog: boolean
  /**
   * 是否执行 `yarn publish --new-version ${version}`
   * @default false
   */
  publish: boolean
}

export interface ReleaseOption {
  beforeBuild: ReleaseStep
  afterBuild: ReleaseStep
  afterDone: ReleaseStep
  steps: Partial<StepOption>
}

export async function release(opt: Partial<ReleaseOption> = {}) {
  const targetVersion: string = await promptReleaseVersion()

  const defaultOption: ReleaseOption = {
    beforeBuild: noop,
    afterBuild: noop,
    afterDone: noop,
    steps: {
      test: true,
      build: true,
      changelog: true,
      publish: false
    }
  }

  const option = mergeDeep(defaultOption, opt)
  const { steps } = option

  const stepActions: (ReleaseStep | undefined | false)[] = [
    steps.test && test,
    option.beforeBuild,
    steps.build && build,
    option.afterBuild,
    updateVersion,
    steps.changelog && generateReleaseNote,
    commit,
    push,
    steps.publish && publishToNpm,
    option.afterDone
  ]

  const stepCtx: ReleaseStepContext = {
    ...cliCtx,
    version: targetVersion
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
