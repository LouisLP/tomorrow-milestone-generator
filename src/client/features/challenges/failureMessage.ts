import type { FieldFailure } from './useSavedChallenge'
import { errorMessage, fieldErrors } from '../../i18n'

/** Translated message for a failed inline save. Call it where it's rendered. */
export function failureMessage(failure: FieldFailure | undefined, entity: 'challenge' | 'milestone'): string | undefined {
  if (!failure)
    return undefined
  if (failure.issue)
    return fieldErrors([failure.issue], entity)[failure.issue.field]
  return errorMessage(failure.code)
}
