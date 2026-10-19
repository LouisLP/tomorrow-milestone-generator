import process from 'node:process'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp } from './app'
import { parseEnv } from './env'

const parsed = parseEnv(process.env)
if (!parsed.ok) {
  console.error(parsed.message)
  process.exit(1)
}
const { env } = parsed

const app = createApp({})

if (env.NODE_ENV === 'production') {
  // Serve the built SPA; any non-file path falls back to index.html so deep links reload.
  app.use('*', serveStatic({ root: './dist' }))
  app.get('*', serveStatic({ path: './dist/index.html' }))
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${info.port}`)
})
