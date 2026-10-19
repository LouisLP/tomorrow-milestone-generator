import type { FieldFailure } from '../types/challenge.types'
import { errorMessage, fieldErrors } from '../../../i18n'

/** Call where it renders, so it follows a language switch. */
export function failureMessage(failure: FieldFailure | undefined, entity: 'challenge' | 'milestone'): string | undefined {
  if (!failure)
    return undefined
  if (failure.issue)
    return fieldErrors([failure.issue], entity)[failure.issue.field]
  return errorMessage(failure.code)
}
