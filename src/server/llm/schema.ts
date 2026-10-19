import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { generateResponse } from '@shared'

/** The API only takes count and lengths as hints; `outputFormat.parse()` enforces them. */
export const aiOutput = generateResponse

export const outputFormat = zodOutputFormat(aiOutput)
