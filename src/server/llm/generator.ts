import type { GenerateRequest, MilestoneContent, ServerErrorCode } from '@shared'

export type GenerationErrorCode = Extract<ServerErrorCode, `generation_${string}`>

export type GenerationResult
  = | { ok: true, milestones: MilestoneContent[] }
    | { ok: false, code: GenerationErrorCode, upstream?: { class: string, status?: number } }

/** Turns a Challenge into Draft Milestones. The route only knows this interface; tests inject a fake. */
export interface Generator {
  generate: (input: GenerateRequest, signal: AbortSignal) => Promise<GenerationResult>
}

/** One model call. Every expected outcome comes back as a result; only bugs throw. */
export type Attempt = (input: GenerateRequest, signal: AbortSignal) => Promise<GenerationResult>

export interface GeneratorOptions {
  /** Wall-clock budget for all attempts, SDK retries included. */
  deadlineMs?: number
}

const MAX_ATTEMPTS = 2

/**
 * Wraps `attempt` with the policy from #7: one extra attempt on `generation_invalid` only,
 * and an overall deadline (or the caller's signal) that ends in `generation_unavailable`.
 */
export function createGenerator(attempt: Attempt, { deadlineMs = 90_000 }: GeneratorOptions = {}): Generator {
  return {
    async generate(input, requestSignal) {
      const signal = AbortSignal.any([requestSignal, AbortSignal.timeout(deadlineMs)])

      let attempts = 0
      let result: GenerationResult
      do {
        attempts++
        result = await attempt(input, signal)
        if (signal.aborted)
          result = { ok: false, code: 'generation_unavailable', upstream: { class: requestSignal.aborted ? 'RequestAborted' : 'Deadline' } }
      } while (!result.ok && result.code === 'generation_invalid' && attempts < MAX_ATTEMPTS)

      // Never log the input or output: it is staff-written content.
      if (!result.ok)
        console.error('generation failed', { code: result.code, upstream: result.upstream, attempts })
      return result
    },
  }
}
