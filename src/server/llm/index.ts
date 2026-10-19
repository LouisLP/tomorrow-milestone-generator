import type { ClaudeConfig } from './claude'
import { createClaudeAttempt } from './claude'
import { createGenerator } from './generator'

export type { GenerationErrorCode, GenerationResult, Generator } from './generator'

/** The real Generator: Claude behind the retry/deadline policy. */
export function createClaudeGenerator(config: ClaudeConfig) {
  return createGenerator(createClaudeAttempt(config))
}
