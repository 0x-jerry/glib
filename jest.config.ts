import type { Config } from '@jest/types'

const conf: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.spec.ts']
}

export default conf
