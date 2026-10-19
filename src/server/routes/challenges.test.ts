import type { ChallengeDetail, ChallengeSummary, Milestone } from '@shared'
import type { Db } from '../db'
import { MILESTONE_CAP } from '@shared'
import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { createDb } from '../db'
import { milestones as milestonesTable } from '../db/schema'

let db: Db
let app: ReturnType<typeof createApp>

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-01-01T00:00:00Z') })
  db = createDb(':memory:')
  app = createApp({ db })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function send(method: string, path: string, body?: unknown) {
  return app.request(path, {
    method,
    ...(body !== undefined && { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
  })
}

function milestones(count: number, prefix = 'Step') {
  return Array.from({ length: count }, (_, index) => ({ title: `${prefix} ${index}`, description: `Do ${prefix} ${index}.` }))
}

async function create(count = 3, title = 'Rust') {
  const res = await send('POST', '/api/challenges', { title, brief: 'Learn Rust.', milestones: milestones(count) })
  expect(res.status).toBe(201)
  return await res.json() as ChallengeDetail
}

async function get(id: number) {
  const res = await send('GET', `/api/challenges/${id}`)
  expect(res.status).toBe(200)
  return await res.json() as ChallengeDetail
}

async function expectError(res: Response, status: number, code: string) {
  expect(res.status).toBe(status)
  expect(await res.json()).toMatchObject({ error: { code } })
}

describe('create and get', () => {
  it('round-trips trimmed values with positions 0..n-1', async () => {
    const res = await send('POST', '/api/challenges', {
      title: '  Rust  ',
      brief: '\nLearn Rust.\t',
      milestones: [{ title: ' Install ', description: ' Get rustup. ' }, { title: 'Hello', description: 'Print it.' }],
    })
    expect(res.status).toBe(201)
    const created = await res.json() as ChallengeDetail

    expect(await get(created.id)).toEqual({
      id: created.id,
      title: 'Rust',
      brief: 'Learn Rust.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      milestones: [
        { id: expect.any(Number), position: 0, title: 'Install', description: 'Get rustup.' },
        { id: expect.any(Number), position: 1, title: 'Hello', description: 'Print it.' },
      ],
    })
    expect(created).toEqual(await get(created.id))
  })

  it.each([
    ['an empty title', { title: '  ', brief: 'x', milestones: milestones(1) }, 'title'],
    ['no milestones', { title: 'x', brief: 'x', milestones: [] }, 'milestones'],
    ['21 milestones', { title: 'x', brief: 'x', milestones: milestones(MILESTONE_CAP + 1) }, 'milestones'],
  ])('answers 400 validation_failed for %s', async (_, body, field) => {
    const res = await send('POST', '/api/challenges', body)

    expect(res.status).toBe(400)
    const json = await res.json() as { error: { code: string, issues: { field: string }[] } }
    expect(json.error.code).toBe('validation_failed')
    expect(json.error.issues).toContainEqual(expect.objectContaining({ field }))
    expect(await (await send('GET', '/api/challenges')).json()).toEqual([])
  })
})

describe('list', () => {
  it('sorts by updatedAt desc with milestone counts', async () => {
    const older = await create(2, 'Older')
    vi.advanceTimersByTime(1000)
    const newer = await create(3, 'Newer')
    vi.advanceTimersByTime(1000)
    await send('PATCH', `/api/challenges/${older.id}`, { brief: 'Edited.' })

    const res = await send('GET', '/api/challenges')

    expect(res.status).toBe(200)
    expect(await res.json() as ChallengeSummary[]).toEqual([
      { id: older.id, title: 'Older', milestoneCount: 2, updatedAt: '2026-01-01T00:00:02.000Z' },
      { id: newer.id, title: 'Newer', milestoneCount: 3, updatedAt: '2026-01-01T00:00:01.000Z' },
    ])
  })
})

describe('update challenge', () => {
  it('updates only the given fields', async () => {
    const challenge = await create()

    const res = await send('PATCH', `/api/challenges/${challenge.id}`, { title: ' Go ' })

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ title: 'Go', brief: 'Learn Rust.', milestones: challenge.milestones })
  })

  it('answers 400 for an empty body', async () => {
    const challenge = await create()

    await expectError(await send('PATCH', `/api/challenges/${challenge.id}`, {}), 400, 'validation_failed')
  })
})

describe('append', () => {
  it('appends after the last position and bumps updatedAt', async () => {
    const challenge = await create(2)
    vi.advanceTimersByTime(5000)

    const res = await send('POST', `/api/challenges/${challenge.id}/milestones`, { milestones: milestones(2, 'More') })

    expect(res.status).toBe(201)
    const detail = await res.json() as ChallengeDetail
    expect(detail.milestones.map(m => [m.position, m.title])).toEqual([[0, 'Step 0'], [1, 'Step 1'], [2, 'More 0'], [3, 'More 1']])
    expect(detail.updatedAt).toBe('2026-01-01T00:00:05.000Z')
  })

  it('answers 409 milestone_cap_exceeded past the cap and writes nothing', async () => {
    const challenge = await create(MILESTONE_CAP - 1)

    const res = await send('POST', `/api/challenges/${challenge.id}/milestones`, { milestones: milestones(2, 'More') })

    await expectError(res, 409, 'milestone_cap_exceeded')
    expect(await get(challenge.id)).toEqual(challenge)
  })

  it('accepts filling up to the cap exactly', async () => {
    const challenge = await create(MILESTONE_CAP - 1)

    const res = await send('POST', `/api/challenges/${challenge.id}/milestones`, { milestones: milestones(1, 'Last') })

    expect(res.status).toBe(201)
  })
})

describe('update milestone', () => {
  it('updates the milestone and bumps the Challenge updatedAt', async () => {
    const challenge = await create()
    const target = challenge.milestones[1]!
    vi.advanceTimersByTime(3000)

    const res = await send('PATCH', `/api/challenges/${challenge.id}/milestones/${target.id}`, { description: ' New. ' })

    expect(res.status).toBe(200)
    expect(await res.json() as Milestone).toEqual({ ...target, description: 'New.' })
    expect((await get(challenge.id)).updatedAt).toBe('2026-01-01T00:00:03.000Z')
  })
})

describe('delete milestone', () => {
  it('recompacts positions, and a later append continues from there', async () => {
    const challenge = await create(3)
    const [first, middle, last] = challenge.milestones

    expect((await send('DELETE', `/api/challenges/${challenge.id}/milestones/${middle!.id}`)).status).toBe(204)

    const afterDelete = await get(challenge.id)
    expect(afterDelete.milestones).toEqual([first, { ...last!, position: 1 }])

    const res = await send('POST', `/api/challenges/${challenge.id}/milestones`, { milestones: milestones(1, 'New') })
    const detail = await res.json() as ChallengeDetail
    expect(detail.milestones.map(m => [m.position, m.title])).toEqual([[0, 'Step 0'], [1, 'Step 2'], [2, 'New 0']])
  })

  it('answers 409 last_milestone for the only Milestone', async () => {
    const challenge = await create(1)

    const res = await send('DELETE', `/api/challenges/${challenge.id}/milestones/${challenge.milestones[0]!.id}`)

    await expectError(res, 409, 'last_milestone')
    expect(await get(challenge.id)).toEqual(challenge)
  })
})

describe('delete challenge', () => {
  it('cascades to its Milestones', async () => {
    const challenge = await create(2)
    const other = await create(1)

    expect((await send('DELETE', `/api/challenges/${challenge.id}`)).status).toBe(204)

    await expectError(await send('GET', `/api/challenges/${challenge.id}`), 404, 'not_found')
    expect(db.select().from(milestonesTable).where(eq(milestonesTable.challengeId, challenge.id)).all()).toEqual([])
    expect((await get(other.id)).milestones).toHaveLength(1)
  })
})

describe('not_found', () => {
  it.each(['999', 'abc', '1.5', '0', '-1'])('answers 404 for challenge id %j on every route', async (id) => {
    const path = `/api/challenges/${id}`
    await expectError(await send('GET', path), 404, 'not_found')
    await expectError(await send('PATCH', path, { title: 'x' }), 404, 'not_found')
    await expectError(await send('DELETE', path), 404, 'not_found')
    await expectError(await send('POST', `${path}/milestones`, { milestones: milestones(1) }), 404, 'not_found')
  })

  it.each(['999', 'abc'])('answers 404 for milestone id %j', async (milestoneId) => {
    const challenge = await create()
    const path = `/api/challenges/${challenge.id}/milestones/${milestoneId}`

    await expectError(await send('PATCH', path, { title: 'x' }), 404, 'not_found')
    await expectError(await send('DELETE', path), 404, 'not_found')
  })

  it('answers 404 for a Milestone under the wrong Challenge', async () => {
    const owner = await create()
    const other = await create()
    const path = `/api/challenges/${other.id}/milestones/${owner.milestones[0]!.id}`

    await expectError(await send('PATCH', path, { title: 'x' }), 404, 'not_found')
    await expectError(await send('DELETE', path), 404, 'not_found')
    expect(await get(owner.id)).toEqual(owner)
  })
})
