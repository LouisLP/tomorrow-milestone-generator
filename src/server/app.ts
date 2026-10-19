import { Hono } from 'hono'

/**
 * Everything the app needs from the outside world. `index.ts` builds the real ones;
 * tests pass fakes. Later tickets add `db` and `generator`.
 */
export interface AppDeps {}

/** Builds the Hono app. Must never read `process.env`: config arrives through `deps`. */
export function createApp(_deps: AppDeps = {}) {
  const app = new Hono()

  app.get('/api/health', c => c.json({ ok: true }))

  // Unknown API routes 404 here instead of falling through to the SPA fallback.
  app.all('/api/*', c => c.notFound())

  return app
}
