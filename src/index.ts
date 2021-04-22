import { UserOption } from './cmd'
import { DeepPartial } from './utils'

export function defineConfig(option: DeepPartial<UserOption>) {
  return option
}
