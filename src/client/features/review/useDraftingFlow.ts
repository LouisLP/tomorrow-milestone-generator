// Wires a page to `createDraftReview` (#4, #6, #7): Generate / Regenerate from the current
// title and Brief, Save through the page's own call, and the guards against losing drafts.
// The New Challenge page uses it now; the detail page's append flow (#19) reuses it.
import type { ChallengeInput, Issue, MilestoneContent } from '@shared'
import type { Ref } from 'vue'
import type { ApiResult, ErrorCode } from '../../api'
import { challengeInput, zodIssues } from '@shared'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { generateMilestones } from '../../api'
import { createDraftReview } from './useDraftReview'

export interface DraftingFlowOptions {
  /** Title and Brief as typed (untrimmed); validated before every Generate and Save. */
  details: Ref<{ title: string, brief: string }>
  /** Milestones the Challenge already has (empty on the new page). */
  savedMilestones?: Ref<MilestoneContent[]>
}

/** Only these server issue fields belong to the title/Brief form. */
const DETAIL_FIELDS = new Set(['title', 'brief'])

function detailIssues(issues: Issue[] | undefined) {
  return (issues ?? []).filter(issue => DETAIL_FIELDS.has(issue.field))
}

/** The flow without the router and window guards, so it runs outside a component. */
export function createDraftingFlow({ details, savedMilestones = ref([]) }: DraftingFlowOptions) {
  // A server 400's issues on title/Brief, until either field changes
  const serverIssues = shallowRef<Issue[]>([])
  watch(details, () => serverIssues.value = [], { deep: true })

  const review = createDraftReview({
    savedMilestones,
    async fetchDrafts(existingMilestones, signal) {
      const result = await generateMilestones({ ...details.value, existingMilestones }, signal)
      if (!result.ok)
        serverIssues.value = detailIssues(result.error.issues)
      return result
    },
  })

  /** Field errors show after the first Generate or Save attempt, then follow typing. */
  const submitted = ref(false)
  const parsed = computed(() => challengeInput.safeParse(details.value))

  /** Failed checks on `title` / `brief`; translate them with `fieldErrors` where they render. */
  const issues = computed<Issue[]>(() => {
    if (submitted.value && !parsed.value.success)
      return zodIssues(parsed.value.error)
    return serverIssues.value
  })

  /** Marks the form submitted; returns the trimmed details, or null if a field is invalid. */
  function validate(): ChallengeInput | null {
    submitted.value = true
    return parsed.value.success ? parsed.value.data : null
  }

  /** Returns false (and generates nothing) when title or Brief is invalid. */
  function generate() {
    if (!validate())
      return false
    void review.generate()
    return true
  }

  // Regenerate replaces every non-accepted draft; ask first if that drops edits
  const regenerateConfirmOpen = ref(false)

  /** Like `generate`, but asks first when it would discard edited drafts. */
  function regenerate() {
    if (!validate())
      return false
    if (review.regenerateDiscardsEdits.value)
      regenerateConfirmOpen.value = true
    else
      void review.generate()
    return true
  }

  function confirmRegenerate() {
    void review.generate()
  }

  const saving = ref(false)
  const saveError = ref<ErrorCode | null>(null)

  /**
   * Runs the page's save call. On success the drafts are cleared (so the leave guard lets
   * the page navigate away); on failure every draft and edit stays and `saveError` is set.
   */
  async function save<T>(handler: () => Promise<ApiResult<T>>): Promise<ApiResult<T> | null> {
    if (saving.value)
      return null
    saving.value = true
    saveError.value = null
    const result = await handler()
    saving.value = false
    if (result.ok) {
      review.clear()
      submitted.value = false
    }
    else {
      saveError.value = result.error.code
      serverIssues.value = detailIssues(result.error.issues)
    }
    return result
  }

  return {
    review,
    issues,
    validate,
    generate,
    regenerate,
    cancel: review.cancel,
    regenerateConfirmOpen,
    confirmRegenerate,
    save,
    saving,
    saveError,
  }
}

/** `createDraftingFlow` plus the guards; call it in a page's setup. */
export function useDraftingFlow(options: DraftingFlowOptions) {
  const flow = createDraftingFlow(options)
  const { hasUnsavedWork } = flow.review

  // In-app navigation: "Discard drafts?" and wait for the answer
  const leaveConfirmOpen = ref(false)
  let answerLeave: ((leave: boolean) => void) | null = null

  function settleLeave(leave: boolean) {
    answerLeave?.(leave)
    answerLeave = null
  }

  onBeforeRouteLeave(() => {
    if (!hasUnsavedWork.value)
      return true
    settleLeave(false)
    leaveConfirmOpen.value = true
    return new Promise<boolean>(resolve => answerLeave = resolve)
  })

  // Closing the dialog any other way than Discard keeps the page
  watch(leaveConfirmOpen, (open) => {
    if (!open)
      settleLeave(false)
  })

  function confirmLeave() {
    flow.review.clear()
    settleLeave(true)
  }

  // Reload / close tab: the browser's own prompt
  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (hasUnsavedWork.value)
      event.preventDefault()
  }
  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

  return { ...flow, leaveConfirmOpen, confirmLeave }
}

export type DraftingFlow = ReturnType<typeof useDraftingFlow>
