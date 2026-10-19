import type {
  ChallengeDetail,
  ChallengeSummary,
  CreateChallengeRequest,
  Milestone,
  MilestoneContent,
  UpdateChallengeRequest,
  UpdateMilestoneRequest,
} from '@shared'
import type { Db } from './client'
import type { ChallengeRow, MilestoneRow } from './schema'
import { MILESTONE_CAP } from '@shared'
import { and, asc, count, desc, eq, max } from 'drizzle-orm'
import { ApiError } from '../http'
import { challenges, milestones } from './schema'

// Queries for Challenges and their Milestones. Rule violations throw `ApiError`, which also
// rolls back the surrounding transaction, so nothing is written.

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

function toMilestone(row: MilestoneRow): Milestone {
  return { id: row.id, position: row.position, title: row.title, description: row.description }
}

function toDetail(row: ChallengeRow, milestoneRows: MilestoneRow[]): ChallengeDetail {
  return {
    id: row.id,
    title: row.title,
    brief: row.brief,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    milestones: milestoneRows.map(toMilestone),
  }
}

function findDetail(db: Db | Tx, id: number): ChallengeDetail | undefined {
  const row = db.select().from(challenges).where(eq(challenges.id, id)).get()
  if (!row)
    return undefined
  const milestoneRows = db.select().from(milestones).where(eq(milestones.challengeId, id)).orderBy(asc(milestones.position)).all()
  return toDetail(row, milestoneRows)
}

function requireDetail(db: Db | Tx, id: number): ChallengeDetail {
  const detail = findDetail(db, id)
  if (!detail)
    throw new ApiError('not_found')
  return detail
}

function requireChallenge(tx: Tx, id: number) {
  const row = tx.select({ id: challenges.id }).from(challenges).where(eq(challenges.id, id)).get()
  if (!row)
    throw new ApiError('not_found')
}

function countMilestones(tx: Tx, challengeId: number) {
  return tx.select({ value: count() }).from(milestones).where(eq(milestones.challengeId, challengeId)).get()?.value ?? 0
}

function touchChallenge(tx: Tx, id: number, now: Date) {
  tx.update(challenges).set({ updatedAt: now }).where(eq(challenges.id, id)).run()
}

function insertMilestones(tx: Tx, challengeId: number, firstPosition: number, items: MilestoneContent[], now: Date) {
  tx.insert(milestones).values(items.map((item, index) => ({
    challengeId,
    position: firstPosition + index,
    title: item.title,
    description: item.description,
    createdAt: now,
    updatedAt: now,
  }))).run()
}

/** Challenges sorted by `updatedAt`, newest first. */
export function listChallenges(db: Db): ChallengeSummary[] {
  const rows = db
    .select({ id: challenges.id, title: challenges.title, updatedAt: challenges.updatedAt, milestoneCount: count(milestones.id) })
    .from(challenges)
    .leftJoin(milestones, eq(milestones.challengeId, challenges.id))
    .groupBy(challenges.id)
    // `updatedAt` has second resolution, so break ties by newest id.
    .orderBy(desc(challenges.updatedAt), desc(challenges.id))
    .all()
  return rows.map(row => ({ ...row, updatedAt: row.updatedAt.toISOString() }))
}

export function getChallenge(db: Db, id: number): ChallengeDetail {
  return requireDetail(db, id)
}

/** Saves a Challenge with its Milestones in one transaction, positions in array order. */
export function createChallenge(db: Db, input: CreateChallengeRequest): ChallengeDetail {
  return db.transaction((tx) => {
    if (input.milestones.length > MILESTONE_CAP)
      throw new ApiError('milestone_cap_exceeded')
    const now = new Date()
    const { id } = tx.insert(challenges)
      .values({ title: input.title, brief: input.brief, createdAt: now, updatedAt: now })
      .returning({ id: challenges.id })
      .get()
    insertMilestones(tx, id, 0, input.milestones, now)
    return requireDetail(tx, id)
  })
}

export function updateChallenge(db: Db, id: number, input: UpdateChallengeRequest): ChallengeDetail {
  return db.transaction((tx) => {
    const updated = tx.update(challenges)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(challenges.id, id))
      .returning({ id: challenges.id })
      .get()
    if (!updated)
      throw new ApiError('not_found')
    return requireDetail(tx, id)
  })
}

/** Deletes a Challenge; its Milestones cascade. */
export function deleteChallenge(db: Db, id: number) {
  const deleted = db.delete(challenges).where(eq(challenges.id, id)).returning({ id: challenges.id }).get()
  if (!deleted)
    throw new ApiError('not_found')
}

/** Appends Milestones after the current last position, in one transaction. */
export function appendMilestones(db: Db, challengeId: number, items: MilestoneContent[]): ChallengeDetail {
  return db.transaction((tx) => {
    requireChallenge(tx, challengeId)
    if (countMilestones(tx, challengeId) + items.length > MILESTONE_CAP)
      throw new ApiError('milestone_cap_exceeded')
    const last = tx.select({ value: max(milestones.position) }).from(milestones).where(eq(milestones.challengeId, challengeId)).get()?.value ?? -1
    const now = new Date()
    insertMilestones(tx, challengeId, last + 1, items, now)
    touchChallenge(tx, challengeId, now)
    return requireDetail(tx, challengeId)
  })
}

function belongsTo(challengeId: number, milestoneId: number) {
  return and(eq(milestones.id, milestoneId), eq(milestones.challengeId, challengeId))
}

export function updateMilestone(db: Db, challengeId: number, milestoneId: number, input: UpdateMilestoneRequest): Milestone {
  return db.transaction((tx) => {
    const now = new Date()
    const row = tx.update(milestones)
      .set({ ...input, updatedAt: now })
      .where(belongsTo(challengeId, milestoneId))
      .returning()
      .get()
    if (!row)
      throw new ApiError('not_found')
    touchChallenge(tx, challengeId, now)
    return toMilestone(row)
  })
}

/** Deletes a Milestone and recompacts the remaining positions. The last one can't be deleted. */
export function deleteMilestone(db: Db, challengeId: number, milestoneId: number) {
  db.transaction((tx) => {
    const target = tx.select({ id: milestones.id }).from(milestones).where(belongsTo(challengeId, milestoneId)).get()
    if (!target)
      throw new ApiError('not_found')
    if (countMilestones(tx, challengeId) === 1)
      throw new ApiError('last_milestone')

    tx.delete(milestones).where(eq(milestones.id, milestoneId)).run()
    const remaining = tx.select({ id: milestones.id, position: milestones.position })
      .from(milestones)
      .where(eq(milestones.challengeId, challengeId))
      .orderBy(asc(milestones.position))
      .all()
    remaining.forEach((row, position) => {
      if (row.position !== position)
        tx.update(milestones).set({ position }).where(eq(milestones.id, row.id)).run()
    })
    touchChallenge(tx, challengeId, new Date())
  })
}
