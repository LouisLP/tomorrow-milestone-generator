import type { GenerationErrorCode, GenerationResult, Generator } from '../llm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { createDb } from '../db'

const body = { title: 'Rust', brief: 'Learn Rust.', existingMilestones: [] }
const content = { title: 'Plan', description: 'Write a plan.' }

function fakeGenerator(result: GenerationResult) {
  return { generate: vi.fn<Generator['generate']>().mockResolvedValue(result) }
}

function post(generator: Generator, payload: unknown) {
  return createApp({ db: createDb(':memory:'), generator }).request('/api/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generate route (POST /api/generate)', () => {
  it('answers 200 with the milestones', async () => {
    const generator = fakeGenerator({ ok: true, milestones: [content, content, content] })

    const res = await post(generator, { ...body, title: '  Rust ' })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ milestones: [content, content, content] })
    expect(generator.generate).toHaveBeenCalledExactlyOnceWith(body, expect.any(AbortSignal))
  })

  it('answers 400 on a bad body without calling the generator', async () => {
    const generator = fakeGenerator({ ok: true, milestones: [] })

    const res = await post(generator, { title: '', brief: 'x' })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: { code: 'validation_failed' } })
    expect(generator.generate).not.toHaveBeenCalled()
  })

  it.each([
    ['generation_refused', 422],
    ['generation_invalid', 502],
    ['generation_unavailable', 502],
    ['generation_rate_limited', 503],
  ] as const satisfies [GenerationErrorCode, number][])('answers %s with %i', async (code, status) => {
    const res = await post(fakeGenerator({ ok: false, code, upstream: { class: 'X', status: 500 } }), body)

    expect(res.status).toBe(status)
    expect(await res.json()).toEqual({ error: { code } })
  })
})
