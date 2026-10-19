import type { ChallengeDetail, GenerateResponse } from '@shared'
import type { ApiResult } from '../../../api'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { generateMilestones } from '../api/generate.api'
import { createDraftingFlow } from './useDraftingFlow'

vi.mock('../api/generate.api', () => ({ generateMilestones: vi.fn() }))

const generate = vi.mocked(generateMilestones)

function ok(...titles: string[]): ApiResult<GenerateResponse> {
  return { ok: true, data: { milestones: titles.map(title => ({ title, description: `${title} description` })) } }
}

const saved: ApiResult<ChallengeDetail> = {
  ok: true,
  data: { id: 1, title: 'Rust', brief: 'Learn Rust.', createdAt: '', updatedAt: '', milestones: [] },
}

function setup(title = 'Rust', brief = 'Learn Rust.') {
  const details = ref({ title, brief })
  const flow = createDraftingFlow({ details })
  return { details, flow }
}

/** Lets the mocked request resolve and the review apply it. */
async function settle() {
  await vi.waitFor(() => expect(generate).toHaveBeenCalled())
  await new Promise(resolve => setTimeout(resolve))
}

function fields(flow: ReturnType<typeof createDraftingFlow>) {
  return flow.issues.value.map(issue => issue.field)
}

function keyOf(flow: ReturnType<typeof createDraftingFlow>, title: string) {
  return flow.review.drafts.value.find(draft => draft.title === title)!.key
}

beforeEach(() => {
  generate.mockReset()
  generate.mockResolvedValue(ok('A', 'B', 'C'))
})

describe('generate', () => {
  it('validates title and Brief instead of calling the API', () => {
    const { flow } = setup('  ', '')

    expect(flow.issues.value).toEqual([])
    expect(flow.generate()).toBe(false)
    expect(generate).not.toHaveBeenCalled()
    expect(fields(flow)).toEqual(['title', 'brief'])
  })

  it('shows errors live after the first attempt', async () => {
    const { details, flow } = setup('', 'Learn Rust.')
    flow.generate()
    expect(fields(flow)).toEqual(['title'])

    details.value.title = 'Rust'
    await nextTick()
    expect(flow.issues.value).toEqual([])
  })

  it('sends the current details and existing milestones', async () => {
    const { flow } = setup()

    expect(flow.generate()).toBe(true)
    await settle()

    expect(generate).toHaveBeenCalledWith(
      { title: 'Rust', brief: 'Learn Rust.', existingMilestones: [] },
      expect.any(AbortSignal),
    )
    expect(flow.review.drafts.value.map(draft => draft.title)).toEqual(['A', 'B', 'C'])
  })

  it('maps a server 400 onto the fields until they change', async () => {
    generate.mockResolvedValue({
      ok: false,
      error: { code: 'validation_failed', issues: [{ field: 'brief', code: 'too_big' }, { field: 'existingMilestones.0.title', code: 'too_small' }] },
    })
    const { details, flow } = setup()

    flow.generate()
    await settle()
    expect(fields(flow)).toEqual(['brief'])

    details.value.brief = 'Shorter.'
    await nextTick()
    expect(flow.issues.value).toEqual([])
  })
})

describe('regenerate', () => {
  it('asks first when edits would be lost, and only generates on confirm', async () => {
    const { flow } = setup()
    flow.generate()
    await settle()
    flow.review.edit(keyOf(flow, 'A'), { title: 'A edited' })
    generate.mockClear()

    flow.regenerate()
    expect(flow.regenerateConfirmOpen.value).toBe(true)
    expect(generate).not.toHaveBeenCalled()

    flow.confirmRegenerate()
    await settle()
    expect(generate).toHaveBeenCalledOnce()
  })

  it('regenerates directly when only accepted drafts were edited', async () => {
    const { flow } = setup()
    flow.generate()
    await settle()
    const a = keyOf(flow, 'A')
    flow.review.edit(a, { title: 'A edited' })
    flow.review.accept(a)
    generate.mockClear()
    generate.mockResolvedValue(ok('D', 'E', 'F'))

    flow.regenerate()
    await settle()

    expect(flow.regenerateConfirmOpen.value).toBe(false)
    expect(flow.review.drafts.value.map(draft => draft.title)).toEqual(['A edited', 'D', 'E', 'F'])
  })
})

describe('save', () => {
  async function withAccepted() {
    const { details, flow } = setup()
    flow.generate()
    await settle()
    flow.review.accept(keyOf(flow, 'A'))
    return { details, flow }
  }

  it('clears the drafts on success', async () => {
    const { flow } = await withAccepted()

    const result = await flow.save(async () => saved)

    expect(result).toBe(saved)
    expect(flow.review.drafts.value).toEqual([])
    expect(flow.review.hasUnsavedWork.value).toBe(false)
    expect(flow.saveError.value).toBeNull()
  })

  it('keeps every draft and sets saveError on failure', async () => {
    const { flow } = await withAccepted()
    const before = flow.review.drafts.value.map(draft => ({ ...draft }))

    await flow.save(async () => ({ ok: false, error: { code: 'milestone_cap_exceeded' } }))

    expect(flow.saveError.value).toBe('milestone_cap_exceeded')
    expect(flow.review.drafts.value).toEqual(before)
    expect(flow.saving.value).toBe(false)
  })

  it('maps title/Brief issues from a failed save onto the fields', async () => {
    const { flow } = await withAccepted()

    await flow.save(async () => ({ ok: false, error: { code: 'validation_failed', issues: [{ field: 'title', code: 'too_big' }] } }))

    expect(fields(flow)).toEqual(['title'])
  })

  it('ignores a second save while one is in flight', async () => {
    const { flow } = await withAccepted()
    let finish: (result: ApiResult<ChallengeDetail>) => void = () => {}
    const handler = vi.fn(() => new Promise<ApiResult<ChallengeDetail>>(resolve => finish = resolve))

    const first = flow.save(handler)
    expect(flow.saving.value).toBe(true)
    expect(await flow.save(handler)).toBeNull()
    finish(saved)
    await first

    expect(handler).toHaveBeenCalledOnce()
  })
})
