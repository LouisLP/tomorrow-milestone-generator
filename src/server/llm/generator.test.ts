import type { Attempt, GenerationResult } from './generator'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGenerator } from './generator'

const input = { title: 'Rust', brief: 'Learn Rust.', existingMilestones: [] }
const content = { title: 'Plan', description: 'Write a plan.' }
const success: GenerationResult = { ok: true, milestones: [content, content, content] }
const invalid: GenerationResult = { ok: false, code: 'generation_invalid', upstream: { class: 'ParseError' } }
const refused: GenerationResult = { ok: false, code: 'generation_refused' }

function attemptReturning(...results: GenerationResult[]) {
  const attempt = vi.fn<Attempt>()
  for (const result of results)
    attempt.mockResolvedValueOnce(result)
  return attempt
}

/** Resolves only once `signal` aborts, like the SDK does. */
const hangingAttempt: Attempt = (_, signal) => new Promise((resolve) => {
  signal.addEventListener('abort', () => resolve({ ok: false, code: 'generation_unavailable', upstream: { class: 'APIUserAbortError' } }))
})

let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createGenerator', () => {
  it('returns the first success without logging', async () => {
    const attempt = attemptReturning(success)

    expect(await createGenerator(attempt).generate(input, new AbortController().signal)).toEqual(success)
    expect(attempt).toHaveBeenCalledOnce()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('retries once on generation_invalid, then succeeds', async () => {
    const attempt = attemptReturning(invalid, success)

    expect(await createGenerator(attempt).generate(input, new AbortController().signal)).toEqual(success)
    expect(attempt).toHaveBeenCalledTimes(2)
  })

  it('gives up after the second generation_invalid', async () => {
    const attempt = attemptReturning(invalid, invalid, success)

    expect(await createGenerator(attempt).generate(input, new AbortController().signal)).toEqual(invalid)
    expect(attempt).toHaveBeenCalledTimes(2)
    expect(consoleError).toHaveBeenCalledExactlyOnceWith('generation failed', {
      code: 'generation_invalid',
      upstream: { class: 'ParseError' },
      attempts: 2,
    })
  })

  it('does not retry a refusal', async () => {
    const attempt = attemptReturning(refused, success)

    expect(await createGenerator(attempt).generate(input, new AbortController().signal)).toEqual(refused)
    expect(attempt).toHaveBeenCalledOnce()
  })

  it('maps the deadline to generation_unavailable', async () => {
    const result = await createGenerator(hangingAttempt, { deadlineMs: 10 }).generate(input, new AbortController().signal)

    expect(result).toEqual({ ok: false, code: 'generation_unavailable', upstream: { class: 'Deadline' } })
  })

  it('does not retry an invalid result once the deadline has passed', async () => {
    const attempt = vi.fn<Attempt>(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      return invalid
    })

    const result = await createGenerator(attempt, { deadlineMs: 10 }).generate(input, new AbortController().signal)

    expect(result).toMatchObject({ code: 'generation_unavailable' })
    expect(attempt).toHaveBeenCalledOnce()
  })

  it('forwards the request signal so a cancel aborts the call', async () => {
    const controller = new AbortController()
    const pending = createGenerator(hangingAttempt).generate(input, controller.signal)

    controller.abort()

    expect(await pending).toEqual({ ok: false, code: 'generation_unavailable', upstream: { class: 'RequestAborted' } })
  })

  it('never logs the input', async () => {
    await createGenerator(attemptReturning(refused)).generate(input, new AbortController().signal)

    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('Learn Rust')
  })
})
