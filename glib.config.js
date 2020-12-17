/**
 * @type {import('./src/cli/index').UserOption}
 */
const conf = {
  release: {
    async afterDone(ctx) {
      ctx.info('Publishing to npm...')
      await ctx.run('yarn', ['publish', '--non-interactive'])
    }
  }
}

module.exports = conf
