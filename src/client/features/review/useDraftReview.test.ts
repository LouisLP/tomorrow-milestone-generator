import type { GenerateResponse, MilestoneContent } from '@shared'
import type { ApiResult } from '../../api'
import type { DraftReviewOptions } from './useDraftReview'
import { MILESTONE_CAP } from '@shared'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createDraftReview } from './useDraftReview'

function milestones(...titles: string[]): MilestoneContent[] {
  return titles.map(title => ({ title, description: `${title} description` }))
}

function ok(...titles: string[]): ApiResult<GenerateResponse> {
  return { ok: true, data: { milestones: milestones(...titles) } }
}

/** A fetch that resolves when the test says so, and resolves `aborted` on abort like `request`. */
function deferredFetch() {
  let resolve: (result: ApiResult<GenerateResponse>) => void = () => {}
  const fetchDrafts = vi.fn<DraftReviewOptions['fetchDrafts']>((_existing, signal) => new Promise((done) => {
    resolve = done
    signal.addEventListener('abort', () => done({ ok: false, error: { code: 'aborted' } }))
  }))
  return { fetchDrafts, resolve: (result: ApiResult<GenerateResponse>) => resolve(result) }
}

async function setup(titles = ['A', 'B', 'C'], saved: MilestoneContent[] = []) {
  const fetchDrafts = vi.fn<DraftReviewOptions['fetchDrafts']>(async () => ok(...titles))
  const review = createDraftReview({ fetchDrafts, savedMilestones: ref(saved) })
  await review.generate()
  return { review, fetchDrafts }
}

function keyOf(review: ReturnType<typeof createDraftReview>, title: string) {
  const draft = review.drafts.value.find(d => d.title === title)
  if (!draft)
    throw new Error(`no draft ${title}`)
  return draft.key
}

function states(review: ReturnType<typeof createDraftReview>) {
  return review.drafts.value.map(d => [d.title, d.state, d.skipped])
}

describe('review decisions', () => {
  it('starts drafts undecided, from the AI', async () => {
    const { review } = await setup()

    expect(review.status.value).toBe('ready')
    expect(review.drafts.value).toHaveLength(3)
    expect(review.drafts.value.every(d => d.state === 'undecided' && d.origin === 'ai' && !d.edited && !d.skipped)).toBe(true)
  })

  it('accept, reject and reset round-trip', async () => {
    const { review } = await setup()
    const a = keyOf(review, 'A')

    review.accept(a)
    expect(review.drafts.value[0]!.state).toBe('accepted')
    review.reject(a)
    expect(review.drafts.value[0]!.state).toBe('rejected')
    review.reset(a)
    expect(review.drafts.value[0]!.state).toBe('undecided')
    expect(review.current.value?.key).toBe(a)
  })

  it('acceptRemaining accepts every undecided draft, skipped included', async () => {
    const { review } = await setup()
    review.reject(keyOf(review, 'A'))
    review.skip(keyOf(review, 'B'))

    review.acceptRemaining()

    expect(states(review)).toEqual([['A', 'rejected', false], ['B', 'accepted', false], ['C', 'accepted', false]])
    expect(review.lastAction.value).toEqual({ kind: 'acceptRemaining', count: 2 })
  })

  it('accepted lists accepted drafts in order, as content only', async () => {
    const { review } = await setup()
    review.accept(keyOf(review, 'C'))
    review.accept(keyOf(review, 'A'))

    expect(review.accepted.value).toEqual(milestones('A', 'C'))
  })
})

describe('edit', () => {
  it('trims, sets edited and never changes state', async () => {
    const { review } = await setup()
    const a = keyOf(review, 'A')
    review.reject(a)

    review.edit(a, { title: '  New A  ' })

    expect(review.drafts.value[0]).toMatchObject({ title: 'New A', description: 'A description', state: 'rejected', edited: true })
  })

  it('ignores empty fields and no-op edits', async () => {
    const { review } = await setup()
    const a = keyOf(review, 'A')

    review.edit(a, { title: '   ', description: 'A description' })

    expect(review.drafts.value[0]).toMatchObject({ title: 'A', edited: false })
    expect(review.canUndo.value).toBe(false)
  })
})

describe('generate', () => {
  it('sends saved milestones then accepted drafts, in order', async () => {
    const saved = milestones('S1', 'S2')
    const { review, fetchDrafts } = await setup(['A', 'B', 'C'], saved)
    review.accept(keyOf(review, 'C'))
    review.accept(keyOf(review, 'A'))

    expect(review.existingForPrompt.value).toEqual(milestones('S1', 'S2', 'A', 'C'))
    await review.generate()
    expect(fetchDrafts).toHaveBeenLastCalledWith(milestones('S1', 'S2', 'A', 'C'), expect.any(AbortSignal))
  })

  it('regenerate keeps accepted drafts and replaces the rest, clearing skips and history', async () => {
    const { review, fetchDrafts } = await setup()
    review.accept(keyOf(review, 'B'))
    review.reject(keyOf(review, 'A'))
    review.skip(keyOf(review, 'C'))
    fetchDrafts.mockResolvedValueOnce(ok('D', 'E', 'F'))

    await review.generate()

    expect(states(review)).toEqual([
      ['B', 'accepted', false],
      ['D', 'undecided', false],
      ['E', 'undecided', false],
      ['F', 'undecided', false],
    ])
    expect(review.canUndo.value).toBe(false)
    expect(review.lastAction.value).toBeNull()
  })

  it('a failed regenerate keeps everything and stores the error', async () => {
    const { review, fetchDrafts } = await setup()
    review.accept(keyOf(review, 'A'))
    review.edit(keyOf(review, 'B'), { title: 'B2' })
    const before = review.drafts.value.map(d => ({ ...d }))
    fetchDrafts.mockResolvedValueOnce({ ok: false, error: { code: 'generation_unavailable' } })

    await review.generate()

    expect(review.drafts.value).toEqual(before)
    expect(review.error.value).toBe('generation_unavailable')
    expect(review.canUndo.value).toBe(true)
    expect(review.status.value).toBe('ready')
  })

  it('clears the error on the next generate', async () => {
    const { review, fetchDrafts } = await setup()
    fetchDrafts.mockResolvedValueOnce({ ok: false, error: { code: 'network_error' } })
    await review.generate()

    const next = review.generate()
    expect(review.error.value).toBeNull()
    await next
  })

  it('ignores a second generate while one is in flight', async () => {
    const { fetchDrafts, resolve } = deferredFetch()
    const review = createDraftReview({ fetchDrafts, savedMilestones: ref([]) })

    const first = review.generate()
    expect(review.status.value).toBe('generating')
    expect(review.hasUnsavedWork.value).toBe(true)
    await review.generate()
    resolve(ok('A', 'B', 'C'))
    await first

    expect(fetchDrafts).toHaveBeenCalledOnce()
    expect(review.drafts.value).toHaveLength(3)
  })

  it('cancel aborts the request and leaves drafts unchanged, with no error', async () => {
    const { fetchDrafts, resolve } = deferredFetch()
    fetchDrafts.mockImplementationOnce(async () => ok('A', 'B', 'C'))
    const review = createDraftReview({ fetchDrafts, savedMilestones: ref([]) })
    await review.generate()
    review.accept(keyOf(review, 'A'))
    const before = review.drafts.value.map(d => ({ ...d }))

    const pending = review.generate()
    review.cancel()
    await pending
    resolve(ok('X', 'Y', 'Z'))

    expect(fetchDrafts.mock.calls[1]![1].aborted).toBe(true)
    expect(review.drafts.value).toEqual(before)
    expect(review.error.value).toBeNull()
    expect(review.status.value).toBe('ready')
  })

  it('a failed first generate goes back to idle', async () => {
    const fetchDrafts = vi.fn<DraftReviewOptions['fetchDrafts']>(async () => ({ ok: false, error: { code: 'generation_refused' } }))
    const review = createDraftReview({ fetchDrafts, savedMilestones: ref([]) })

    await review.generate()

    expect(review.status.value).toBe('idle')
    expect(review.hasUnsavedWork.value).toBe(false)
  })

  it('regenerateDiscardsEdits only counts non-accepted drafts', async () => {
    const { review } = await setup()
    const a = keyOf(review, 'A')
    review.accept(a)
    review.edit(a, { title: 'A2' })
    expect(review.regenerateDiscardsEdits.value).toBe(false)

    review.edit(keyOf(review, 'B'), { description: 'new' })
    expect(review.regenerateDiscardsEdits.value).toBe(true)
  })
})

describe('current draft and skip', () => {
  it('is the first undecided non-skipped draft, then the first skipped', async () => {
    const { review } = await setup()

    expect(review.current.value?.title).toBe('A')
    review.skip(keyOf(review, 'A'))
    expect(review.current.value?.title).toBe('B')
    review.accept(keyOf(review, 'B'))
    expect(review.current.value?.title).toBe('C')
    review.reject(keyOf(review, 'C'))
    expect(review.current.value?.title).toBe('A')
    review.accept(keyOf(review, 'A'))
    expect(review.current.value).toBeNull()
  })

  it('skip is not a Review Decision', async () => {
    const { review } = await setup()

    review.skip(keyOf(review, 'A'))

    expect(review.drafts.value[0]).toMatchObject({ state: 'undecided', skipped: true })
    expect(review.counts.value).toEqual({ undecided: 2, accepted: 0, rejected: 0, skipped: 1 })
    expect(review.undecidedCount.value).toBe(3)
  })

  it('skipping the selected draft moves on', async () => {
    const { review } = await setup()
    const c = keyOf(review, 'C')
    review.select(c)
    expect(review.current.value?.key).toBe(c)

    review.skip(c)

    expect(review.current.value?.title).toBe('A')
  })

  it('select on an undecided draft makes it current without an undo entry', async () => {
    const { review } = await setup()

    review.select(keyOf(review, 'B'))

    expect(review.current.value?.title).toBe('B')
    expect(review.canUndo.value).toBe(false)
  })

  it.each(['accept', 'reject'] as const)('select on a draft after %s resets it and makes it current', async (decision) => {
    const { review } = await setup()
    const b = keyOf(review, 'B')
    review[decision](b)

    review.select(b)

    expect(review.drafts.value[1]!.state).toBe('undecided')
    expect(review.current.value?.key).toBe(b)
    expect(review.lastAction.value).toEqual({ kind: 'reset', title: 'B' })
  })

  it('select on a skipped draft clears the skip mark and makes it current', async () => {
    const { review } = await setup()
    const b = keyOf(review, 'B')
    review.skip(b)

    review.select(b)

    expect(review.drafts.value[1]!.skipped).toBe(false)
    expect(review.current.value?.key).toBe(b)
  })
})

describe('undo', () => {
  it('restores decisions, skip marks and edits, one step at a time', async () => {
    const { review } = await setup()
    const a = keyOf(review, 'A')
    const b = keyOf(review, 'B')
    review.accept(a)
    review.skip(b)
    review.edit(b, { title: 'B2' })

    expect(review.lastAction.value).toEqual({ kind: 'edit', title: 'B' })
    review.undo()
    expect(review.drafts.value[1]).toMatchObject({ title: 'B', edited: false, skipped: true })
    expect(review.lastAction.value).toEqual({ kind: 'skip', title: 'B' })
    review.undo()
    expect(review.drafts.value[1]!.skipped).toBe(false)
    review.undo()
    expect(review.drafts.value[0]!.state).toBe('undecided')
    expect(review.canUndo.value).toBe(false)
    expect(review.lastAction.value).toBeNull()
  })

  it('restores the current draft after a reset', async () => {
    const { review } = await setup()
    const c = keyOf(review, 'C')
    review.accept(c)
    review.reset(c)
    expect(review.current.value?.key).toBe(c)

    review.undo()

    expect(review.current.value?.title).toBe('A')
  })

  it('keeps at most 50 steps', async () => {
    const { review } = await setup()
    const a = keyOf(review, 'A')
    for (let i = 0; i < 60; i++)
      review.edit(a, { title: `A${i}` })

    for (let i = 0; i < 50; i++)
      review.undo()

    expect(review.canUndo.value).toBe(false)
    expect(review.drafts.value[0]!.title).toBe('A9')
  })
})

describe('staff-written drafts', () => {
  it('start accepted with origin staff, after the others', async () => {
    const { review } = await setup()

    const key = review.addStaffDraft({ title: ' Mine ', description: ' Do it. ' })

    expect(review.drafts.value.at(-1)).toEqual({
      key,
      title: 'Mine',
      description: 'Do it.',
      state: 'accepted',
      skipped: false,
      edited: false,
      origin: 'staff',
    })
    expect(review.lastAction.value).toEqual({ kind: 'add', title: 'Mine' })
  })

  it('rejects empty fields', async () => {
    const { review } = await setup()

    expect(review.addStaffDraft({ title: '  ', description: 'x' })).toBeNull()
    expect(review.drafts.value).toHaveLength(3)
  })

  it('can be added before any generate', () => {
    const review = createDraftReview({ fetchDrafts: vi.fn(), savedMilestones: ref([]) })

    review.addStaffDraft({ title: 'Mine', description: 'Do it.' })

    expect(review.status.value).toBe('ready')
    expect(review.hasUnsavedWork.value).toBe(true)
  })

  it('only staff drafts can be removed, and removal is undoable', async () => {
    const { review } = await setup()
    const key = review.addStaffDraft({ title: 'Mine', description: 'Do it.' })!

    review.removeStaffDraft(keyOf(review, 'A'))
    expect(review.drafts.value).toHaveLength(4)
    review.removeStaffDraft(key)
    expect(review.drafts.value).toHaveLength(3)
    review.undo()
    expect(review.drafts.value.at(-1)?.key).toBe(key)
  })
})

describe('cap', () => {
  it('atCap and overCap count saved milestones and accepted drafts', async () => {
    const saved = milestones(...Array.from({ length: MILESTONE_CAP - 2 }, (_, i) => `S${i}`))
    const { review, fetchDrafts } = await setup(['A', 'B', 'C'], saved)

    review.accept(keyOf(review, 'A'))
    expect([review.atCap.value, review.overCap.value]).toEqual([false, false])
    review.accept(keyOf(review, 'B'))
    expect([review.atCap.value, review.overCap.value]).toEqual([true, false])
    review.accept(keyOf(review, 'C'))
    expect([review.atCap.value, review.overCap.value]).toEqual([true, true])

    await review.generate()
    expect(fetchDrafts).toHaveBeenCalledOnce()
  })
})

describe('clear', () => {
  it('drops drafts, history and error', async () => {
    const { review } = await setup()
    review.accept(keyOf(review, 'A'))

    review.clear()

    expect(review.drafts.value).toEqual([])
    expect(review.canUndo.value).toBe(false)
    expect(review.status.value).toBe('idle')
    expect(review.hasUnsavedWork.value).toBe(false)
  })
})
