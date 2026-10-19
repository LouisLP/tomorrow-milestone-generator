import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { generateResponse } from '@shared'

/**
 * What Claude must return: the shared response schema (3–5 Draft Milestones, same field limits).
 * The API can't enforce the count or lengths, so `zodOutputFormat` sends them as hints and
 * `outputFormat.parse()` re-checks them locally, trimming fields as it goes.
 */
export const aiOutput = generateResponse

export const outputFormat = zodOutputFormat(aiOutput)
