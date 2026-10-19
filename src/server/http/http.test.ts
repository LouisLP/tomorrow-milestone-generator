import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createApp } from '../app'
import { createDb } from '../db'
import { ApiError, handleError, handleNotFound } from './errors'
import { validateJson } from './validate'

function testApp() {
  const app = new Hono()
  app.onError(handleError)
  app.notFound(handleNotFound)

  const schema = z.object({
    milestones: z.array(z.object({ title: z.string().trim().min(1).max(5) })),
  })
  app.post('/validate', validateJson(schema), c => c.json(c.req.valid('json')))
  app.get('/throw', () => {
    throw new Error('secret database detail')
  })
  app.get('/cap', () => {
    throw new ApiError('milestone_cap_exceeded')
  })
  return app
}

function postJson(app: Hono, body: string) {
  return app.request('/validate', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('validateJson', () => {
  it('passes the parsed body through', async () => {
    const res = await postJson(testApp(), JSON.stringify({ milestones: [{ title: ' Plan ' }] }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ milestones: [{ title: 'Plan' }] })
  })

  it('answers 400 validation_failed with dotted field paths', async () => {
    const body = { milestones: [{ title: 'ok' }, { title: '   ' }, { title: 'too long' }, { title: 3 }] }

    const res = await postJson(testApp(), JSON.stringify(body))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: {
        code: 'validation_failed',
        issues: [
          { field: 'milestones.1.title', code: 'too_small' },
          { field: 'milestones.2.title', code: 'too_big' },
          { field: 'milestones.3.title', code: 'invalid_type' },
        ],
      },
    })
  })

  it('answers 400 validation_failed for malformed JSON', async () => {
    const res = await postJson(testApp(), '{ nope')

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: { code: 'validation_failed' } })
  })
})

describe('error handling', () => {
  it('maps an ApiError to its status', async () => {
    const res = await testApp().request('/cap')

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: { code: 'milestone_cap_exceeded' } })
  })

  it('answers 500 internal without leaking the message', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await testApp().request('/throw')

    expect(res.status).toBe(500)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({ error: { code: 'internal' } })
    expect(text).not.toContain('secret')
    expect(consoleError).toHaveBeenCalledOnce()
  })

  it('answers unknown routes with a JSON 404', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const res = await createApp({ db: createDb(':memory:') }).request('/api/nope')

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: { code: 'not_found' } })
  })
})
