import type { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { zodIssues } from '@shared'
import { ApiError } from './errors'

/** Validates the JSON body against `schema`; failures become 400 `validation_failed` with `issues`. */
export function validateJson<T extends z.ZodType>(schema: T) {
  return zValidator('json', schema, (result) => {
    if (!result.success)
      throw new ApiError('validation_failed', zodIssues(result.error))
  })
}
