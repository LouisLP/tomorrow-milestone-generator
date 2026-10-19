import { describe, expect, it } from 'vitest'
import { LIMITS } from './limits'
import {
  appendMilestonesRequest,
  challengeInput,
  createChallengeRequest,
  generateRequest,
  generateResponse,
  milestoneContent,
  updateChallengeRequest,
  updateMilestoneRequest,
} from './schemas'

const content = { title: 'Plan', description: 'Write a plan.' }

function milestones(count: number) {
  return Array.from({ length: count }).fill(content)
}

describe('field schemas', () => {
  it('trims text fields', () => {
    expect(challengeInput.parse({ title: '  Rust  ', brief: '\nLearn Rust.\t' }))
      .toEqual({ title: 'Rust', brief: 'Learn Rust.' })
  })

  it.each(['', '   ', '\n\t'])('rejects %j as empty after trimming', (value) => {
    const result = milestoneContent.safeParse({ title: value, description: 'x' })

    expect(result.error?.issues[0]).toMatchObject({ code: 'too_small', path: ['title'] })
  })

  it.each([
    [challengeInput, 'title', LIMITS.challengeTitle, { brief: 'x' }],
    [challengeInput, 'brief', LIMITS.brief, { title: 'x' }],
    [milestoneContent, 'title', LIMITS.milestoneTitle, { description: 'x' }],
    [milestoneContent, 'description', LIMITS.milestoneDescription, { title: 'x' }],
  ] as const)('limits %#: %s to its max length', (schema, field, max, rest) => {
    expect(schema.safeParse({ ...rest, [field]: 'a'.repeat(max) }).success).toBe(true)
    expect(schema.safeParse({ ...rest, [field]: 'a'.repeat(max + 1) }).error?.issues[0])
      .toMatchObject({ code: 'too_big', path: [field] })
  })

  it('checks max length after trimming', () => {
    const title = ` ${'a'.repeat(LIMITS.milestoneTitle)} `

    expect(milestoneContent.safeParse({ title, description: 'x' }).success).toBe(true)
  })
})

describe('milestone arrays', () => {
  const challenge = { title: 'Rust', brief: 'Learn Rust.' }

  it.each([
    [0, false],
    [1, true],
    [20, true],
    [21, false],
  ])('create and append accept %i milestones: %s', (count, ok) => {
    expect(createChallengeRequest.safeParse({ ...challenge, milestones: milestones(count) }).success).toBe(ok)
    expect(appendMilestonesRequest.safeParse({ milestones: milestones(count) }).success).toBe(ok)
  })

  it.each([
    [0, true],
    [1, true],
    [20, true],
    [21, false],
  ])('generate request accepts %i existing milestones: %s', (count, ok) => {
    expect(generateRequest.safeParse({ ...challenge, existingMilestones: milestones(count) }).success).toBe(ok)
  })

  it.each([
    [2, false],
    [3, true],
    [5, true],
    [6, false],
  ])('generate response accepts %i milestones: %s', (count, ok) => {
    expect(generateResponse.safeParse({ milestones: milestones(count) }).success).toBe(ok)
  })
})

describe('update requests', () => {
  it.each([updateChallengeRequest, updateMilestoneRequest])('reject an empty object (%#)', (schema) => {
    expect(schema.safeParse({}).success).toBe(false)
  })

  it('accept a single key', () => {
    expect(updateChallengeRequest.parse({ brief: ' New brief ' })).toEqual({ brief: 'New brief' })
    expect(updateMilestoneRequest.parse({ title: 'New title' })).toEqual({ title: 'New title' })
  })

  it('validate the keys that are present', () => {
    expect(updateMilestoneRequest.safeParse({ description: '  ' }).success).toBe(false)
  })
})
