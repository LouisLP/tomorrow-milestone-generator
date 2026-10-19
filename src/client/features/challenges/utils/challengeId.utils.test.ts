import { describe, expect, it } from 'vitest'
import { parseChallengeId } from './challengeId.utils'

describe('parseChallengeId', () => {
  it('accepts positive integers', () => {
    expect(parseChallengeId('7')).toBe(7)
  })

  it.each(['0', '-1', '1.5', '1e3', ' 7', 'abc', '', '99999999999999999999'])('rejects %j', (value) => {
    expect(parseChallengeId(value)).toBeNull()
  })
})
