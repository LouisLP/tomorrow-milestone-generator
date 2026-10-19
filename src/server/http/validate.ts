import type { Issue } from '@shared'
import type { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { ApiError } from './errors'

function toIssues(error: z.core.$ZodError): Issue[] {
  return error.issues.map(issue => ({ field: issue.path.join('.'), code: issue.code }))
}

/** Validates the JSON body against `schema`; failures become 400 `validation_failed` with `issues`. */
export function validateJson<T extends z.ZodType>(schema: T) {
  return zValidator('json', schema, (result) => {
    if (!result.success)
      throw new ApiError('validation_failed', toIssues(result.error))
  })
}
