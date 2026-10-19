// Client-side review state for Draft Milestones (#4, #6, #7). One instance per page:
// call `createDraftReview` in the page's setup; nothing is shared between pages.
import type { GenerateResponse, MilestoneContent } from '@shared'
import type { Ref } from 'vue'
import type { ApiResult, ErrorCode } from '../../api'
import { MILESTONE_CAP } from '@shared'
import { computed, getCurrentScope, onScopeDispose, readonly, ref, shallowRef } from 'vue'

export type DraftState = 'undecided' | 'accepted' | 'rejected'

export interface Draft {
  key: string
  title: string
  description: string
  state: DraftState
  /** Deferred in the review queue. Not a Review Decision: the draft stays undecided. */
  skipped: boolean
  edited: boolean
  origin: 'ai' | 'staff'
}

export type ReviewStatus = 'idle' | 'generating' | 'ready'

/** What the last undoable change was, for the snackbar text. */
export type ReviewAction
  = | { kind: 'accept' | 'reject' | 'reset' | 'skip' | 'unskip' | 'edit' | 'add' | 'remove', title: string }
    | { kind: 'acceptRemaining', count: number }

export interface DraftReviewOptions {
  /** Asks for a new batch; pages pass a closure over `generateMilestones` with title and brief. */
  fetchDrafts: (existing: MilestoneContent[], signal: AbortSignal) => Promise<ApiResult<GenerateResponse>>
  /** Milestones the Challenge already has (empty on the new page). */
  savedMilestones: Ref<MilestoneContent[]>
}

interface Snapshot {
  drafts: Draft[]
  selectedKey: string | null
  action: ReviewAction
}

const HISTORY_LIMIT = 50

function content({ title, description }: MilestoneContent): MilestoneContent {
  return { title, description }
}

export function createDraftReview({ fetchDrafts, savedMilestones }: DraftReviewOptions) {
  const drafts = ref<Draft[]>([])
  const selectedKey = ref<string | null>(null)
  const history = ref<Snapshot[]>([])
  const error = ref<ErrorCode | null>(null)
  const controller = shallowRef<AbortController | null>(null)

  const generating = computed(() => controller.value !== null)

  const status = computed<ReviewStatus>(() => {
    if (generating.value)
      return 'generating'
    return drafts.value.length > 0 ? 'ready' : 'idle'
  })

  /** Disjoint buckets: `undecided` excludes skipped drafts, which `skipped` counts. */
  const counts = computed(() => {
    const result = { undecided: 0, accepted: 0, rejected: 0, skipped: 0 }
    for (const draft of drafts.value) {
      if (draft.state === 'undecided')
        result[draft.skipped ? 'skipped' : 'undecided']++
      else
        result[draft.state]++
    }
    return result
  })

  /** Every draft without a Review Decision, skipped or not. */
  const undecidedCount = computed(() => counts.value.undecided + counts.value.skipped)

  /** Accepted drafts in order, ready to Save. */
  const accepted = computed(() => drafts.value.filter(draft => draft.state === 'accepted').map(content))

  const existingForPrompt = computed(() => [...savedMilestones.value.map(content), ...accepted.value])

  const atCap = computed(() => existingForPrompt.value.length >= MILESTONE_CAP)
  const overCap = computed(() => existingForPrompt.value.length > MILESTONE_CAP)

  const hasUnsavedWork = computed(() => drafts.value.length > 0 || generating.value)

  /** Regenerate replaces every non-accepted draft, so edits to those would be lost. */
  const regenerateDiscardsEdits = computed(() =>
    drafts.value.some(draft => draft.state !== 'accepted' && draft.edited),
  )

  const current = computed(() => {
    const undecided = drafts.value.filter(draft => draft.state === 'undecided')
    return undecided.find(draft => draft.key === selectedKey.value)
      ?? undecided.find(draft => !draft.skipped)
      ?? undecided[0]
      ?? null
  })

  const lastAction = computed(() => history.value.at(-1)?.action ?? null)
  const canUndo = computed(() => history.value.length > 0)

  function find(key: string) {
    return drafts.value.find(draft => draft.key === key)
  }

  function snapshot(action: ReviewAction) {
    history.value.push({
      drafts: drafts.value.map(draft => ({ ...draft })),
      selectedKey: selectedKey.value,
      action,
    })
    if (history.value.length > HISTORY_LIMIT)
      history.value.shift()
  }

  function undo() {
    const previous = history.value.pop()
    if (!previous)
      return
    drafts.value = previous.drafts
    selectedKey.value = previous.selectedKey
  }

  function decide(key: string, state: 'accepted' | 'rejected') {
    const draft = find(key)
    if (!draft || draft.state === state)
      return
    snapshot({ kind: state === 'accepted' ? 'accept' : 'reject', title: draft.title })
    draft.state = state
    draft.skipped = false
  }

  function accept(key: string) {
    decide(key, 'accepted')
  }

  function reject(key: string) {
    decide(key, 'rejected')
  }

  /** Takes back a Review Decision; the draft becomes the current one. */
  function reset(key: string) {
    const draft = find(key)
    if (!draft || draft.state === 'undecided')
      return
    snapshot({ kind: 'reset', title: draft.title })
    draft.state = 'undecided'
    selectedKey.value = key
  }

  function acceptRemaining() {
    const remaining = drafts.value.filter(draft => draft.state === 'undecided')
    if (remaining.length === 0)
      return
    snapshot({ kind: 'acceptRemaining', count: remaining.length })
    for (const draft of remaining) {
      draft.state = 'accepted'
      draft.skipped = false
    }
  }

  /** Defers an undecided draft; the queue moves on to the next one. */
  function skip(key: string) {
    const draft = find(key)
    if (!draft || draft.state !== 'undecided' || draft.skipped)
      return
    snapshot({ kind: 'skip', title: draft.title })
    draft.skipped = true
    if (selectedKey.value === key)
      selectedKey.value = null
  }

  /** Segment click: makes `key` current, taking back its decision or skip mark. */
  function select(key: string) {
    const draft = find(key)
    if (!draft)
      return
    if (draft.state !== 'undecided')
      return reset(key)
    if (draft.skipped) {
      snapshot({ kind: 'unskip', title: draft.title })
      draft.skipped = false
    }
    selectedKey.value = key
  }

  /** Trims both fields and ignores empty ones. Never changes the draft's state. */
  function edit(key: string, patch: Partial<MilestoneContent>) {
    const draft = find(key)
    if (!draft)
      return
    const title = patch.title?.trim() || draft.title
    const description = patch.description?.trim() || draft.description
    if (title === draft.title && description === draft.description)
      return
    snapshot({ kind: 'edit', title: draft.title })
    draft.title = title
    draft.description = description
    draft.edited = true
  }

  /** Writing a draft is the decision, so it starts accepted. Returns its key, or null if a field is empty. */
  function addStaffDraft(patch: MilestoneContent) {
    const title = patch.title.trim()
    const description = patch.description.trim()
    if (!title || !description)
      return null
    snapshot({ kind: 'add', title })
    const key = crypto.randomUUID()
    drafts.value.push({ key, title, description, state: 'accepted', skipped: false, edited: false, origin: 'staff' })
    return key
  }

  function removeStaffDraft(key: string) {
    const draft = find(key)
    if (draft?.origin !== 'staff')
      return
    snapshot({ kind: 'remove', title: draft.title })
    drafts.value = drafts.value.filter(other => other.key !== key)
  }

  /**
   * Generates (or regenerates) a batch. On success accepted drafts stay, in order, and the
   * new batch replaces everything else; undo history and skip marks are cleared. On failure
   * or cancel the drafts are untouched.
   */
  async function generate() {
    if (generating.value || atCap.value)
      return
    const ownController = new AbortController()
    controller.value = ownController
    error.value = null

    const result = await fetchDrafts(existingForPrompt.value, ownController.signal)
    if (controller.value !== ownController)
      return
    controller.value = null

    if (!result.ok) {
      if (result.error.code !== 'aborted')
        error.value = result.error.code
      return
    }

    const kept = drafts.value
      .filter(draft => draft.state === 'accepted')
      .map(draft => ({ ...draft, skipped: false }))
    const batch = result.data.milestones.map((milestone): Draft => ({
      key: crypto.randomUUID(),
      ...content(milestone),
      state: 'undecided',
      skipped: false,
      edited: false,
      origin: 'ai',
    }))
    drafts.value = [...kept, ...batch]
    selectedKey.value = null
    history.value = []
  }

  function cancel() {
    controller.value?.abort()
  }

  /** Call after a successful Save. */
  function clear() {
    cancel()
    controller.value = null
    drafts.value = []
    selectedKey.value = null
    history.value = []
    error.value = null
  }

  if (getCurrentScope())
    onScopeDispose(cancel)

  return {
    drafts: readonly(drafts),
    status,
    error: readonly(error),
    current,
    counts,
    accepted,
    undecidedCount,
    existingForPrompt,
    atCap,
    overCap,
    hasUnsavedWork,
    regenerateDiscardsEdits,
    lastAction,
    canUndo,
    generate,
    cancel,
    accept,
    reject,
    reset,
    acceptRemaining,
    skip,
    select,
    edit,
    addStaffDraft,
    removeStaffDraft,
    undo,
    clear,
  }
}

export type DraftReview = ReturnType<typeof createDraftReview>
