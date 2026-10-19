import type { GenerateResponse } from '@shared'
import type { Generator } from '../llm'
import { generateRequest } from '@shared'
import { Hono } from 'hono'
import { ApiError, validateJson } from '../http'

/** `POST /api/generate`: Draft Milestones for a Challenge. Stateless; nothing is saved. */
export function generateRoutes(generator: Generator) {
  return new Hono().post('/', validateJson(generateRequest), async (c) => {
    // The request signal aborts the Claude call when the client cancels or disconnects.
    const result = await generator.generate(c.req.valid('json'), c.req.raw.signal)
    if (!result.ok)
      throw new ApiError(result.code)
    return c.json({ milestones: result.milestones } satisfies GenerateResponse)
  })
}
