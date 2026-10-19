import { describe, expect, it } from 'vitest'
import { createApp } from './app'

describe('createApp', () => {
  it('responds to the health check', async () => {
    const app = createApp({})

    const res = await app.request('/api/health')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
