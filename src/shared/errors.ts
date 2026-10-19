import { z } from 'zod'

export const serverErrorCode = z.enum([
  'validation_failed',
  'not_found',
  'milestone_cap_exceeded',
  'last_milestone',
  'generation_refused',
  'generation_invalid',
  'generation_rate_limited',
  'generation_unavailable',
  'internal',
])

/** One failed check: `field` is the zod path joined with `.` (e.g. `milestones.2.title`), `code` the zod issue code. */
export const issue = z.object({
  field: z.string(),
  code: z.string(),
})

/** Body of every non-2xx API response. `issues` is only sent with `validation_failed`. */
export const errorBody = z.object({
  error: z.object({
    code: serverErrorCode,
    issues: z.array(issue).optional(),
  }),
})

/** Flattens a zod error into `issues`; the server sends these and the client maps its own the same way. */
export function zodIssues(error: z.core.$ZodError): Issue[] {
  return error.issues.map(({ path, code }) => ({ field: path.join('.'), code }))
}

export type ServerErrorCode = z.infer<typeof serverErrorCode>
export type Issue = z.infer<typeof issue>
export type ErrorBody = z.infer<typeof errorBody>
