import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

export type Db = BetterSQLite3Database<typeof schema>

const MIGRATIONS_FOLDER = fileURLToPath(new URL('./migrations', import.meta.url))

/** Opens the SQLite database at `url` (a file path or `:memory:`) and applies pending migrations. */
export function createDb(url: string): Db {
  if (url !== ':memory:')
    mkdirSync(dirname(url), { recursive: true })

  const sqlite = new Database(url)
  // SQLite leaves foreign keys off by default; the Milestone cascade needs them.
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('journal_mode = WAL')

  const db = drizzle({ client: sqlite, schema, casing: 'snake_case' })
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
  return db
}
