import type { Attempt } from './generator'
import Anthropic from '@anthropic-ai/sdk'
import { buildUserMessage, SYSTEM_PROMPT } from './prompt'
import { resultFromError, resultFromMessage } from './result'
import { outputFormat } from './schema'

export interface ClaudeConfig {
  apiKey: string
  model: string
}

/** One structured-output call to Claude. The SDK retries 429/5xx/connection errors twice on its own. */
export function createClaudeAttempt({ apiKey, model }: ClaudeConfig): Attempt {
  const client = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 2 })

  return async (input, signal) => {
    try {
      const message = await client.messages.create({
        model,
        max_tokens: 8000, // includes adaptive-thinking tokens
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(input) }],
        output_config: { format: outputFormat, effort: 'low' },
      }, { signal })
      return resultFromMessage(message)
    }
    catch (error) {
      return resultFromError(error)
    }
  }
}
