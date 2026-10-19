import { LIMITS } from '@shared'
import { describe, expect, it } from 'vitest'
import { aiOutput, outputFormat } from './schema'

const content = { title: 'Plan', description: 'Write a plan.' }

function milestones(count: number, item = content) {
  return Array.from({ length: count }).fill(item)
}

describe('aiOutput', () => {
  it.each([
    [2, false],
    [3, true],
    [5, true],
    [6, false],
  ])('accepts %i milestones: %s', (count, ok) => {
    expect(aiOutput.safeParse({ milestones: milestones(count) }).success).toBe(ok)
  })

  it.each([
    ['empty title', { title: '  ', description: 'x' }],
    ['empty description', { title: 'x', description: '' }],
    ['oversized title', { title: 'a'.repeat(LIMITS.milestoneTitle + 1), description: 'x' }],
    ['oversized description', { title: 'x', description: 'a'.repeat(LIMITS.milestoneDescription + 1) }],
  ])('rejects an %s', (_, item) => {
    expect(aiOutput.safeParse({ milestones: [content, content, item] }).success).toBe(false)
  })
})

describe('outputFormat', () => {
  it('trims fields when parsing', () => {
    const text = JSON.stringify({ milestones: milestones(3, { title: ' Plan ', description: '\nWrite a plan.\t' }) })

    expect(outputFormat.parse(text)).toEqual({ milestones: milestones(3) })
  })

  it('throws on a count the API does not enforce', () => {
    expect(() => outputFormat.parse(JSON.stringify({ milestones: milestones(2) }))).toThrow()
  })

  it('sends the count to the model as a hint, not a constraint', () => {
    const { milestones } = (outputFormat.schema as { properties: { milestones: Record<string, unknown> } }).properties

    expect(milestones.minItems).toBeUndefined()
    expect(milestones.description).toContain('minItems: 3')
  })
})
