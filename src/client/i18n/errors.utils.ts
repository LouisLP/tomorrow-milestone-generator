import type { Issue } from '@shared'
import type { z } from 'zod'
import { LIMITS, MILESTONE_CAP, zodIssues } from '@shared'
import { i18n } from './i18n'

// Call these where the text renders, not once into state, so it follows a language switch

/** Codes without copy fall back to `errors.unknown`. */
export function errorMessage(code: string): string {
  const { t, te } = i18n.global
  const key = `errors.${code}`
  return te(key, 'en') ? t(key, { cap: MILESTONE_CAP }) : t('errors.unknown')
}

/** `entity` disambiguates a top-level `title`. */
function maxLength(field: string, entity: 'challenge' | 'milestone'): number | undefined {
  const segments = field.split('.')
  const inMilestone = entity === 'milestone'
    || segments.some(segment => segment === 'milestones' || segment === 'existingMilestones')

  switch (segments.at(-1)) {
    case 'title': return inMilestone ? LIMITS.milestoneTitle : LIMITS.challengeTitle
    case 'brief': return LIMITS.brief
    case 'description': return LIMITS.milestoneDescription
    default: return undefined
  }
}

function issueMessage({ field, code }: Issue, entity: 'challenge' | 'milestone'): string {
  const { t } = i18n.global
  const max = maxLength(field, entity)

  // `too_small` on a text field means empty after trimming
  if (max !== undefined && code === 'too_small')
    return t('validation.required')
  if (max !== undefined && code === 'too_big')
    return t('validation.tooLong', { max })
  return t('validation.invalid')
}

/** Field path → message; the first issue per field wins. */
export function fieldErrors(
  source: Issue[] | z.core.$ZodError,
  entity: 'challenge' | 'milestone' = 'challenge',
): Record<string, string> {
  const issues = Array.isArray(source) ? source : zodIssues(source)
  const errors: Record<string, string> = {}
  for (const issue of issues)
    errors[issue.field] ??= issueMessage(issue, entity)
  return errors
}
