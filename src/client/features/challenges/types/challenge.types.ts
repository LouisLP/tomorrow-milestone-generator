import type { Issue } from '@shared'
import type { ErrorCode } from '../../../api'

export type ChallengeField = 'title' | 'brief'
export type MilestoneField = 'title' | 'description'

export type FieldKey = ChallengeField | `milestone.${number}.${MilestoneField}`

/** Kept as data, not text, so the message follows a language switch. */
export interface FieldFailure {
  code: ErrorCode
  issue?: Issue
}
