import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ANTHROPIC_API_KEY: z.string({ error: 'is required (see .env.example)' }).trim().min(1, 'is required (see .env.example)'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().trim().min(1).default('./data/app.db'),
  CLAUDE_MODEL: z.string().trim().min(1).default('claude-sonnet-5-5'),
})

export type Env = z.infer<typeof envSchema>

export type ParseEnvResult
  = | { ok: true, env: Env }
    | { ok: false, message: string }

/** Validates raw environment variables. Takes the source as an argument so it stays testable. */
export function parseEnv(source: Record<string, string | undefined>): ParseEnvResult {
  // Treat empty strings (e.g. `PORT=` copied from .env.example) as unset so defaults apply.
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ''))
  const result = envSchema.safeParse(cleaned)
  if (result.success)
    return { ok: true, env: result.data }

  const issues = result.error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
  return { ok: false, message: `Invalid environment:\n${issues.join('\n')}` }
}
