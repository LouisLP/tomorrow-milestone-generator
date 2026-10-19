import type { Issue, ServerErrorCode } from '@shared'
import type { z } from 'zod'
import { errorBody } from '@shared'

/** Server codes plus the failures only the client can see. */
export type ErrorCode = ServerErrorCode | 'network_error' | 'unexpected_response' | 'unknown' | 'aborted'

export interface ApiError {
  code: ErrorCode
  issues?: Issue[]
}

export type ApiResult<T>
  = | { ok: true, data: T }
    | { ok: false, error: ApiError }

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

function failure(code: ErrorCode, issues?: Issue[]): { ok: false, error: ApiError } {
  return { ok: false, error: { code, ...(issues && { issues }) } }
}

/** Reads the body as JSON; `undefined` when it is empty or not JSON. */
async function readJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text)
    return undefined
  try {
    return JSON.parse(text)
  }
  catch {
    return undefined
  }
}

/**
 * Calls the API and parses the response with `schema`. Never throws: every failure,
 * including an aborted `signal`, comes back as `{ ok: false, error }`. Without a
 * `schema` the body is ignored and `data` is `undefined` (for 204 endpoints).
 */
export async function request<T>(path: string, options: RequestOptions & { schema: z.ZodType<T> }): Promise<ApiResult<T>>
export async function request(path: string, options?: RequestOptions): Promise<ApiResult<undefined>>
export async function request<T>(
  path: string,
  { method = 'GET', body, signal, schema }: RequestOptions & { schema?: z.ZodType<T> } = {},
): Promise<ApiResult<T | undefined>> {
  try {
    const res = await fetch(path, {
      method,
      signal,
      ...(body !== undefined && {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }),
    })

    if (!res.ok) {
      const parsed = errorBody.safeParse(await readJson(res))
      return parsed.success
        ? failure(parsed.data.error.code, parsed.data.error.issues)
        : failure('unknown')
    }

    if (!schema)
      return { ok: true, data: undefined }

    const parsed = schema.safeParse(await readJson(res))
    return parsed.success ? { ok: true, data: parsed.data } : failure('unexpected_response')
  }
  catch {
    // fetch() and reading the body only throw on abort or a network failure.
    return failure(signal?.aborted ? 'aborted' : 'network_error')
  }
}
