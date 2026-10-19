import type { ChallengeDetail, Milestone } from '@shared'
import { LIMITS } from '@shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../api'
import { createSavedChallenge, milestoneFieldKey } from './useSavedChallenge'

vi.mock('../../api')

const NOW = '2026-10-19T12:00:00.000Z'

function milestone(id: number, position: number): Milestone {
  return { id, position, title: `M${id}`, description: `M${id} description` }
}

function detail(milestones = [milestone(1, 0), milestone(2, 1)]): ChallengeDetail {
  return { id: 7, title: 'Rust', brief: 'Learn Rust.', createdAt: NOW, updatedAt: NOW, milestones }
}

async function loaded(challenge = detail()) {
  vi.mocked(api.getChallenge).mockResolvedValue({ ok: true, data: challenge })
  const saved = createSavedChallenge()
  await saved.load(challenge.id)
  return saved
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('load', () => {
  it('loads the Challenge', async () => {
    const saved = await loaded()

    expect(saved.challenge.value?.title).toBe('Rust')
    expect(saved.loadError.value).toBeNull()
    expect(saved.loading.value).toBe(false)
  })

  it('reports not_found for an id that cannot exist, without a request', async () => {
    const saved = createSavedChallenge()

    await saved.load(null)

    expect(saved.loadError.value).toBe('not_found')
    expect(api.getChallenge).not.toHaveBeenCalled()
  })

  it('keeps the error code and retries', async () => {
    vi.mocked(api.getChallenge).mockResolvedValueOnce({ ok: false, error: { code: 'network_error' } })
    const saved = createSavedChallenge()
    await saved.load(7)

    expect(saved.loadError.value).toBe('network_error')

    vi.mocked(api.getChallenge).mockResolvedValueOnce({ ok: true, data: detail() })
    await saved.retry()

    expect(saved.loadError.value).toBeNull()
    expect(saved.challenge.value?.id).toBe(7)
  })
})

describe('inline edits', () => {
  it('sends the trimmed value and keeps the saved Challenge', async () => {
    const saved = await loaded()
    vi.mocked(api.updateChallenge).mockResolvedValue({ ok: true, data: { ...detail(), title: 'Go' } })

    await saved.saveChallengeField('title', '  Go ')

    expect(api.updateChallenge).toHaveBeenCalledWith(7, { title: 'Go' })
    expect(saved.challenge.value?.title).toBe('Go')
  })

  it('rejects an invalid value without a request', async () => {
    const saved = await loaded()

    await saved.saveChallengeField('brief', '   ')

    expect(api.updateChallenge).not.toHaveBeenCalled()
    expect(saved.fieldFailures.value.brief).toEqual({
      code: 'validation_failed',
      issue: { field: 'brief', code: 'too_small' },
    })
  })

  it('skips the request when nothing changed after trimming', async () => {
    const saved = await loaded()

    await saved.saveChallengeField('title', 'Rust ')

    expect(api.updateChallenge).not.toHaveBeenCalled()
  })

  it('keeps the last saved value and records the failure', async () => {
    const saved = await loaded()
    vi.mocked(api.updateChallenge).mockResolvedValue({ ok: false, error: { code: 'network_error' } })

    await saved.saveChallengeField('title', 'Go')

    expect(saved.challenge.value?.title).toBe('Rust')
    expect(saved.fieldFailures.value.title).toEqual({ code: 'network_error' })
  })

  it('clears a field failure on the next save', async () => {
    const saved = await loaded()
    await saved.saveChallengeField('title', '')
    vi.mocked(api.updateChallenge).mockResolvedValue({ ok: true, data: { ...detail(), title: 'Go' } })

    await saved.saveChallengeField('title', 'Go')

    expect(saved.fieldFailures.value.title).toBeUndefined()
  })

  it('updates one Milestone in place', async () => {
    const saved = await loaded()
    const updated = { ...milestone(2, 1), description: 'New' }
    vi.mocked(api.updateMilestone).mockResolvedValue({ ok: true, data: updated })

    await saved.saveMilestoneField(2, 'description', 'New')

    expect(api.updateMilestone).toHaveBeenCalledWith(7, 2, { description: 'New' })
    expect(saved.challenge.value?.milestones[1]).toEqual(updated)
  })

  it('records a Milestone failure under its own key', async () => {
    const saved = await loaded()

    await saved.saveMilestoneField(1, 'title', 'a'.repeat(LIMITS.milestoneTitle + 1))

    expect(saved.fieldFailures.value[milestoneFieldKey(1, 'title')]?.issue?.code).toBe('too_big')
    expect(saved.challenge.value?.milestones[0]?.title).toBe('M1')
  })
})

describe('deletes', () => {
  it('removes the Milestone and refetches', async () => {
    const saved = await loaded(detail([milestone(1, 0), milestone(2, 1), milestone(3, 2)]))
    vi.mocked(api.deleteMilestone).mockResolvedValue({ ok: true, data: undefined })
    vi.mocked(api.getChallenge).mockResolvedValue({ ok: true, data: detail([milestone(1, 0), milestone(3, 1)]) })

    expect(await saved.deleteMilestone(2)).toBeNull()

    expect(api.getChallenge).toHaveBeenCalledTimes(2)
    expect(saved.challenge.value?.milestones.map(m => [m.id, m.position])).toEqual([[1, 0], [3, 1]])
  })

  it('keeps the Milestones and returns the code when the delete fails', async () => {
    const saved = await loaded()
    vi.mocked(api.deleteMilestone).mockResolvedValue({ ok: false, error: { code: 'last_milestone' } })

    expect(await saved.deleteMilestone(2)).toBe('last_milestone')
    expect(saved.challenge.value?.milestones).toHaveLength(2)
  })

  it('allows deleting a Milestone only while more than one remains', async () => {
    expect((await loaded()).canDeleteMilestone.value).toBe(true)
    expect((await loaded(detail([milestone(1, 0)]))).canDeleteMilestone.value).toBe(false)
  })

  it('treats deleting an already deleted Challenge as done', async () => {
    const saved = await loaded()
    vi.mocked(api.deleteChallenge).mockResolvedValue({ ok: false, error: { code: 'not_found' } })

    expect(await saved.deleteChallenge()).toBeNull()
  })

  it('returns the code when the Challenge delete fails', async () => {
    const saved = await loaded()
    vi.mocked(api.deleteChallenge).mockResolvedValue({ ok: false, error: { code: 'internal' } })

    expect(await saved.deleteChallenge()).toBe('internal')
  })
})
