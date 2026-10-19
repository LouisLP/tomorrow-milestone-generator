import process from 'node:process'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp } from './app'
import { createDb } from './db'
import { parseEnv } from './env'
import { createClaudeGenerator } from './llm'

const parsed = parseEnv(process.env)
if (!parsed.ok) {
  console.error(parsed.message)
  process.exit(1)
}
const { env } = parsed

const db = createDb(env.DATABASE_URL)
const app = createApp({
  db,
  generator: createClaudeGenerator({ apiKey: env.ANTHROPIC_API_KEY, model: env.CLAUDE_MODEL }),
})

if (env.NODE_ENV === 'production') {
  // Serve the built SPA; any non-file path falls back to index.html so deep links reload.
  app.use('*', serveStatic({ root: './dist' }))
  app.get('*', serveStatic({ path: './dist/index.html' }))
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${info.port}`)
})
