import type Anthropic from '@anthropic-ai/sdk'
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIUserAbortError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
} from '@anthropic-ai/sdk'
import { describe, expect, it } from 'vitest'
import { resultFromError, resultFromMessage } from './result'

const content = { title: 'Plan', description: 'Write a plan.' }
const valid = JSON.stringify({ milestones: [content, content, content] })

function message(stopReason: Anthropic.StopReason, text = valid) {
  return {
    stop_reason: stopReason,
    content: [{ type: 'text', text, citations: null }],
  } satisfies Pick<Anthropic.Message, 'stop_reason' | 'content'>
}

describe('resultFromMessage', () => {
  it('returns the parsed milestones on end_turn', () => {
    expect(resultFromMessage(message('end_turn'))).toEqual({ ok: true, milestones: [content, content, content] })
  })

  it('maps refusal to generation_refused without parsing', () => {
    expect(resultFromMessage(message('refusal', '{"partial'))).toMatchObject({ ok: false, code: 'generation_refused' })
  })

  it.each(['max_tokens', 'model_context_window_exceeded', 'pause_turn'] as const)('maps %s to generation_invalid', (stopReason) => {
    expect(resultFromMessage(message(stopReason))).toMatchObject({ ok: false, code: 'generation_invalid' })
  })

  it.each([
    ['malformed JSON', '{"milestones": ['],
    ['the wrong count', JSON.stringify({ milestones: [content, content] })],
    ['an empty field', JSON.stringify({ milestones: [content, content, { title: ' ', description: 'x' }] })],
  ])('maps %s to generation_invalid', (_, text) => {
    expect(resultFromMessage(message('end_turn', text))).toMatchObject({ ok: false, code: 'generation_invalid' })
  })

  it('maps a response with no text block to generation_invalid', () => {
    expect(resultFromMessage({ stop_reason: 'end_turn', content: [] })).toMatchObject({ ok: false, code: 'generation_invalid' })
  })
})

describe('resultFromError', () => {
  const headers = new Headers()

  it.each([
    ['RateLimitError', new RateLimitError(429, undefined, 'rate limited', headers), 429],
    ['overloaded (529)', new InternalServerError(529, undefined, 'overloaded', headers), 529],
  ])('maps %s to generation_rate_limited', (_, error, status) => {
    expect(resultFromError(error)).toEqual({
      ok: false,
      code: 'generation_rate_limited',
      upstream: { class: error.constructor.name, status },
    })
  })

  it.each([
    ['a timeout', new APIConnectionTimeoutError()],
    ['a connection error', new APIConnectionError({ message: 'reset' })],
    ['an abort', new APIUserAbortError()],
    ['a 500', new InternalServerError(500, undefined, 'boom', headers)],
    ['a bad key', new AuthenticationError(401, undefined, 'bad key', headers)],
    ['no permission', new PermissionDeniedError(403, undefined, 'denied', headers)],
    ['a bad model', new NotFoundError(404, undefined, 'no model', headers)],
    ['a bad request', new BadRequestError(400, undefined, 'bad', headers)],
  ])('maps %s to generation_unavailable', (_, error) => {
    expect(resultFromError(error)).toMatchObject({
      ok: false,
      code: 'generation_unavailable',
      upstream: { class: error.constructor.name, status: error.status },
    })
  })

  it('rethrows errors that do not come from the SDK', () => {
    const bug = new TypeError('undefined is not a function')

    expect(() => resultFromError(bug)).toThrow(bug)
  })
})
