import type {
  AppendMilestonesRequest,
  CreateChallengeRequest,
  GenerateRequest,
  UpdateChallengeRequest,
  UpdateMilestoneRequest,
} from '@shared'
import { challengeDetail, challengeSummary, generateResponse, milestone } from '@shared'
import { request } from './request'

function challengePath(id: number) {
  return `/api/challenges/${id}`
}

function milestonePath(challengeId: number, milestoneId: number) {
  return `${challengePath(challengeId)}/milestones/${milestoneId}`
}

/** Challenges sorted by `updatedAt`, newest first. */
export function listChallenges() {
  return request('/api/challenges', { schema: challengeSummary.array() })
}

export function getChallenge(id: number) {
  return request(challengePath(id), { schema: challengeDetail })
}

export function createChallenge(body: CreateChallengeRequest) {
  return request('/api/challenges', { method: 'POST', body, schema: challengeDetail })
}

export function updateChallenge(id: number, body: UpdateChallengeRequest) {
  return request(challengePath(id), { method: 'PATCH', body, schema: challengeDetail })
}

export function deleteChallenge(id: number) {
  return request(challengePath(id), { method: 'DELETE' })
}

export function appendMilestones(challengeId: number, body: AppendMilestonesRequest) {
  return request(`${challengePath(challengeId)}/milestones`, { method: 'POST', body, schema: challengeDetail })
}

export function updateMilestone(challengeId: number, milestoneId: number, body: UpdateMilestoneRequest) {
  return request(milestonePath(challengeId, milestoneId), { method: 'PATCH', body, schema: milestone })
}

export function deleteMilestone(challengeId: number, milestoneId: number) {
  return request(milestonePath(challengeId, milestoneId), { method: 'DELETE' })
}

/** Asks the AI for Draft Milestones. Abort `signal` to cancel (the result is then `aborted`). */
export function generateMilestones(body: GenerateRequest, signal?: AbortSignal) {
  return request('/api/generate', { method: 'POST', body, schema: generateResponse, signal })
}
