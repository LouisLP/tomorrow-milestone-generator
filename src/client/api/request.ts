import type { Issue, ServerErrorCode } from '@shared'
import type { z } from 'zod'
import { errorBody } from '@shared'

/** Server codes plus client-only failures. */
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

/** `undefined` for an empty or non-JSON body. */
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

/** Never throws: every failure, abort included, resolves as `{ ok: false }`. No `schema` means no body (204). */
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
    return failure(signal?.aborted ? 'aborted' : 'network_error')
  }
}
