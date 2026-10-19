import { defineConfig } from 'drizzle-kit'

// Only used by `pnpm db:generate`; the server applies migrations itself at boot.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/server/db/schema.ts',
  out: './src/server/db/migrations',
  casing: 'snake_case',
})
