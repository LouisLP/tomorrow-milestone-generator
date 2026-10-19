import type { Db } from '../db'
import {
  appendMilestonesRequest,
  createChallengeRequest,
  updateChallengeRequest,
  updateMilestoneRequest,
} from '@shared'
import { Hono } from 'hono'
import { challengeRepo } from '../db'
import { ApiError, validateJson } from '../http'

/** Parses a path id; anything but a positive integer is a 404, like a missing row. */
function parseId(value: string) {
  const id = Number(value)
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1)
    throw new ApiError('not_found')
  return id
}

/** Challenge and Milestone endpoints, mounted at `/api/challenges`. */
export function challengeRoutes(db: Db) {
  return new Hono()
    .get('/', c => c.json(challengeRepo.listChallenges(db)))
    .post('/', validateJson(createChallengeRequest), c =>
      c.json(challengeRepo.createChallenge(db, c.req.valid('json')), 201))
    .get('/:id', c => c.json(challengeRepo.getChallenge(db, parseId(c.req.param('id')))))
    .patch('/:id', validateJson(updateChallengeRequest), c =>
      c.json(challengeRepo.updateChallenge(db, parseId(c.req.param('id')), c.req.valid('json'))))
    .delete('/:id', (c) => {
      challengeRepo.deleteChallenge(db, parseId(c.req.param('id')))
      return c.body(null, 204)
    })
    .post('/:id/milestones', validateJson(appendMilestonesRequest), c =>
      c.json(challengeRepo.appendMilestones(db, parseId(c.req.param('id')), c.req.valid('json').milestones), 201))
    .patch('/:id/milestones/:milestoneId', validateJson(updateMilestoneRequest), c =>
      c.json(challengeRepo.updateMilestone(db, parseId(c.req.param('id')), parseId(c.req.param('milestoneId')), c.req.valid('json'))))
    .delete('/:id/milestones/:milestoneId', (c) => {
      challengeRepo.deleteMilestone(db, parseId(c.req.param('id')), parseId(c.req.param('milestoneId')))
      return c.body(null, 204)
    })
}
