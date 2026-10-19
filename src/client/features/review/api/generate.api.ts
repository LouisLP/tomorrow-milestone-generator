import type { GenerateRequest } from '@shared'
import { generateResponse } from '@shared'
import { request } from '../../../api'

/** Aborting `signal` resolves with the `aborted` code. */
export function generateMilestones(body: GenerateRequest, signal?: AbortSignal) {
  return request('/api/generate', { method: 'POST', body, schema: generateResponse, signal })
}
