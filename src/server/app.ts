import type { Db } from './db'
import type { Generator } from './llm'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { handleError, handleNotFound } from './http'
import { challengeRoutes } from './routes/challenges'
import { generateRoutes } from './routes/generate'

/**
 * Everything the app needs from the outside world. `index.ts` builds the real ones;
 * tests pass fakes (e.g. an in-memory `db`, a stub `generator`).
 */
export interface AppDeps {
  db: Db
  generator: Generator
}

/** Builds the Hono app. Must never read `process.env`: config arrives through `deps`. */
export function createApp(deps: AppDeps) {
  const app = new Hono()

  // Logs method, path, status and timing only; request bodies are never logged.
  app.use('/api/*', logger())
  app.onError(handleError)
  app.notFound(handleNotFound)

  app.get('/api/health', c => c.json({ ok: true }))
  app.route('/api/challenges', challengeRoutes(deps.db))
  app.route('/api/generate', generateRoutes(deps.generator))

  // Unknown API routes 404 here instead of falling through to the SPA fallback.
  app.all('/api/*', c => c.notFound())

  return app
}
