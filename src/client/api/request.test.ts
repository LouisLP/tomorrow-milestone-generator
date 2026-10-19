import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { request } from './request'

const schema = z.object({ id: z.number() })

function stubFetch(impl: (input: string, init: RequestInit) => Promise<Response>) {
  const fetch = vi.fn(impl)
  vi.stubGlobal('fetch', fetch)
  return fetch
}

function respond(body: string | null, status = 200) {
  stubFetch(async () => new Response(body, { status }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request', () => {
  it('returns parsed data on success', async () => {
    respond(JSON.stringify({ id: 1, extra: true }))

    expect(await request('/api/x', { schema })).toEqual({ ok: true, data: { id: 1 } })
  })

  it('returns network_error when fetch throws', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    expect(await request('/api/x', { schema })).toEqual({ ok: false, error: { code: 'network_error' } })
  })

  it('returns aborted when the signal is aborted', async () => {
    stubFetch((_input, init) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    const controller = new AbortController()

    const result = request('/api/x', { schema, signal: controller.signal })
    controller.abort()

    expect(await result).toEqual({ ok: false, error: { code: 'aborted' } })
  })

  it('returns unexpected_response for a non-JSON 2xx body', async () => {
    respond('<html>oops</html>')

    expect(await request('/api/x', { schema })).toEqual({ ok: false, error: { code: 'unexpected_response' } })
  })

  it('returns unexpected_response when the body fails the schema', async () => {
    respond(JSON.stringify({ id: 'one' }))

    expect(await request('/api/x', { schema })).toEqual({ ok: false, error: { code: 'unexpected_response' } })
  })

  it('returns the server error code and issues', async () => {
    const issues = [{ field: 'milestones.2.title', code: 'too_big' }]
    respond(JSON.stringify({ error: { code: 'validation_failed', issues } }), 400)

    expect(await request('/api/x', { schema })).toEqual({ ok: false, error: { code: 'validation_failed', issues } })
  })

  it('returns unknown for an unrecognised error code', async () => {
    respond(JSON.stringify({ error: { code: 'teapot' } }), 418)

    expect(await request('/api/x', { schema })).toEqual({ ok: false, error: { code: 'unknown' } })
  })

  it('returns unknown for an unparseable error body', async () => {
    respond('Bad Gateway', 502)

    expect(await request('/api/x', { schema })).toEqual({ ok: false, error: { code: 'unknown' } })
  })

  it('returns undefined data for a 204', async () => {
    respond(null, 204)

    expect(await request('/api/x', { method: 'DELETE' })).toEqual({ ok: true, data: undefined })
  })
})
