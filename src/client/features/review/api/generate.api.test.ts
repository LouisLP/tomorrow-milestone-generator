import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateMilestones } from './generate.api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('generateMilestones', () => {
  it('sends method, path, JSON body and signal', async () => {
    const milestones = Array.from({ length: 3 }, (_, i) => ({ title: `T${i}`, description: 'D' }))
    const fetch = vi.fn(async () => new Response(JSON.stringify({ milestones })))
    vi.stubGlobal('fetch', fetch)
    const body = { title: 'Rust', brief: 'Learn Rust.', existingMilestones: [] }
    const { signal } = new AbortController()

    const result = await generateMilestones(body, signal)

    expect(result).toEqual({ ok: true, data: { milestones } })
    expect(fetch).toHaveBeenCalledWith('/api/generate', {
      method: 'POST',
      signal,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  })
})
