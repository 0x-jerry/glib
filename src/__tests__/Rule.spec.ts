import { Rule, RuleExecutor } from '../Rule'

describe('rule executor', () => {
  it('rule', () => {
    const result = RuleExecutor<string | number>([
      Rule(false, 1),
      {
        condition: () => true,
        result: () => 16
      },
      Rule(true, '3')
    ])

    expect(result).toBe(16)
  })
})
