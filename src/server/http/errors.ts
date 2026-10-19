import type { ErrorBody, Issue, ServerErrorCode } from '@shared'
import type { Context, ErrorHandler, NotFoundHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { HTTPException } from 'hono/http-exception'

/** The one place an error code gets its HTTP status. */
const STATUS_BY_CODE = {
  validation_failed: 400,
  not_found: 404,
  milestone_cap_exceeded: 409,
  last_milestone: 409,
  generation_refused: 422,
  generation_invalid: 502,
  generation_rate_limited: 503,
  generation_unavailable: 502,
  internal: 500,
} as const satisfies Record<ServerErrorCode, ContentfulStatusCode>

/** Throw from a route to answer with `{ error: { code, issues? } }` and the code's status. */
export class ApiError extends Error {
  readonly status: ContentfulStatusCode

  constructor(readonly code: ServerErrorCode, readonly issues?: Issue[]) {
    super(code)
    this.name = 'ApiError'
    this.status = STATUS_BY_CODE[code]
  }
}

function errorResponse(c: Context, error: ApiError) {
  const body: ErrorBody = { error: { code: error.code, ...(error.issues && { issues: error.issues }) } }
  return c.json(body, error.status)
}

/** `app.onError`: known errors keep their code; anything else is logged and becomes a bare 500. */
export const handleError: ErrorHandler = (err, c) => {
  if (err instanceof ApiError)
    return errorResponse(c, err)

  // Hono's validator throws a 400 HTTPException for a malformed JSON body.
  if (err instanceof HTTPException && err.status === 400)
    return errorResponse(c, new ApiError('validation_failed'))

  console.error(err)
  return errorResponse(c, new ApiError('internal'))
}

export const handleNotFound: NotFoundHandler = c => errorResponse(c, new ApiError('not_found'))
