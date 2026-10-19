import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

describe('parseEnv', () => {
  it('applies defaults when only the API key is set', () => {
    const result = parseEnv({ ANTHROPIC_API_KEY: 'sk-test' })

    expect(result).toEqual({
      ok: true,
      env: {
        NODE_ENV: 'development',
        ANTHROPIC_API_KEY: 'sk-test',
        PORT: 3000,
        DATABASE_URL: './data/app.db',
        CLAUDE_MODEL: 'claude-sonnet-5-5',
      },
    })
  })

  it('coerces PORT to a number', () => {
    const result = parseEnv({ ANTHROPIC_API_KEY: 'sk-test', PORT: '4000' })

    expect(result.ok && result.env.PORT).toBe(4000)
  })

  it.each([undefined, '', '   '])('fails naming ANTHROPIC_API_KEY when it is %j', (key) => {
    const result = parseEnv({ ANTHROPIC_API_KEY: key })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.message).toContain('ANTHROPIC_API_KEY')
  })
})
