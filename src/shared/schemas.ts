import { z } from 'zod'
import { GENERATED_MAX, GENERATED_MIN, LIMITS, MILESTONE_CAP } from './limits'

function text(max: number) {
  return z.string().trim().min(1).max(max)
}

function atLeastOneKey(value: Record<string, unknown>) {
  return Object.values(value).some(field => field !== undefined)
}

const id = z.number().int().positive()
const isoDate = z.iso.datetime({ offset: true })

// Fields

export const challengeInput = z.object({
  title: text(LIMITS.challengeTitle),
  brief: text(LIMITS.brief),
})

export const milestoneContent = z.object({
  title: text(LIMITS.milestoneTitle),
  description: text(LIMITS.milestoneDescription),
})

// Requests

export const createChallengeRequest = challengeInput.extend({
  milestones: z.array(milestoneContent).min(1).max(MILESTONE_CAP),
})

export const appendMilestonesRequest = z.object({
  milestones: z.array(milestoneContent).min(1).max(MILESTONE_CAP),
})

export const updateChallengeRequest = challengeInput
  .partial()
  .refine(atLeastOneKey, { message: 'At least one field is required' })

export const updateMilestoneRequest = milestoneContent
  .partial()
  .refine(atLeastOneKey, { message: 'At least one field is required' })

export const generateRequest = challengeInput.extend({
  existingMilestones: z.array(milestoneContent).max(MILESTONE_CAP),
})

// Responses (dates are ISO strings)

export const challengeSummary = z.object({
  id,
  title: z.string(),
  milestoneCount: z.number().int().nonnegative(),
  updatedAt: isoDate,
})

export const milestone = milestoneContent.extend({
  id,
  position: z.number().int().nonnegative(),
})

/** `milestones` are sorted by `position`. */
export const challengeDetail = challengeInput.extend({
  id,
  createdAt: isoDate,
  updatedAt: isoDate,
  milestones: z.array(milestone),
})

export const generateResponse = z.object({
  milestones: z.array(milestoneContent).min(GENERATED_MIN).max(GENERATED_MAX),
})

export type ChallengeInput = z.infer<typeof challengeInput>
export type MilestoneContent = z.infer<typeof milestoneContent>
export type CreateChallengeRequest = z.infer<typeof createChallengeRequest>
export type AppendMilestonesRequest = z.infer<typeof appendMilestonesRequest>
export type UpdateChallengeRequest = z.infer<typeof updateChallengeRequest>
export type UpdateMilestoneRequest = z.infer<typeof updateMilestoneRequest>
export type GenerateRequest = z.infer<typeof generateRequest>
export type ChallengeSummary = z.infer<typeof challengeSummary>
export type Milestone = z.infer<typeof milestone>
export type ChallengeDetail = z.infer<typeof challengeDetail>
export type GenerateResponse = z.infer<typeof generateResponse>
