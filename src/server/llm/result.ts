import type Anthropic from '@anthropic-ai/sdk'
import type { GenerationResult } from './generator'
import { APIError, RateLimitError } from '@anthropic-ai/sdk'
import { outputFormat } from './schema'

/** HTTP status Anthropic uses for "overloaded". */
const OVERLOADED = 529

/** Maps a response to a result. Checks `stop_reason` before parsing, so a refusal is never reported as invalid. */
export function resultFromMessage(message: Pick<Anthropic.Message, 'stop_reason' | 'content'>): GenerationResult {
  if (message.stop_reason === 'refusal')
    return { ok: false, code: 'generation_refused' }
  // `max_tokens` and anything else unexpected may have cut the JSON short.
  if (message.stop_reason !== 'end_turn')
    return { ok: false, code: 'generation_invalid', upstream: { class: `stop_reason:${message.stop_reason}` } }

  const text = message.content.find(block => block.type === 'text')?.text ?? ''
  try {
    return { ok: true, milestones: outputFormat.parse(text).milestones }
  }
  catch {
    // JSON or zod failure, including a count outside 3–5.
    return { ok: false, code: 'generation_invalid', upstream: { class: 'ParseError' } }
  }
}

/** Maps an error thrown by the SDK (after its own retries) to a result. Anything that isn't an SDK error is rethrown. */
export function resultFromError(error: unknown): GenerationResult {
  if (!(error instanceof APIError))
    throw error

  const upstream = { class: error.constructor.name, status: error.status }
  if (error instanceof RateLimitError || error.status === OVERLOADED)
    return { ok: false, code: 'generation_rate_limited', upstream }
  // Timeouts, connection errors, aborts, 5xx, and 4xx such as a bad key or model.
  return { ok: false, code: 'generation_unavailable', upstream }
}
