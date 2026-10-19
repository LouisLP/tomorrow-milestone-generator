import type { ChallengeInput, Issue, MilestoneContent } from '@shared'
import type { Ref } from 'vue'
import type { ApiResult, ErrorCode } from '../../../api'
import { challengeInput, zodIssues } from '@shared'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { generateMilestones } from '../api/generate.api'
import { createDraftReview } from './useDraftReview'

export interface DraftingFlowOptions {
  /** As typed (untrimmed). */
  details: Ref<{ title: string, brief: string }>
  savedMilestones?: Ref<MilestoneContent[]>
}

const DETAIL_FIELDS = new Set(['title', 'brief'])

function detailIssues(issues: Issue[] | undefined) {
  return (issues ?? []).filter(issue => DETAIL_FIELDS.has(issue.field))
}

/** Without the router and window guards, so tests can run it outside a component. */
export function createDraftingFlow({ details, savedMilestones = ref([]) }: DraftingFlowOptions) {
  // Cleared once either field changes
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

  // Field errors show from the first Generate or Save on, then follow typing
  const submitted = ref(false)
  const parsed = computed(() => challengeInput.safeParse(details.value))

  const issues = computed<Issue[]>(() => {
    if (submitted.value && !parsed.value.success)
      return zodIssues(parsed.value.error)
    return serverIssues.value
  })

  /** Trimmed details, or `null` if a field is invalid. */
  function validate(): ChallengeInput | null {
    submitted.value = true
    return parsed.value.success ? parsed.value.data : null
  }

  /** `false` when title or Brief is invalid. */
  function generate() {
    if (!validate())
      return false
    void review.generate()
    return true
  }

  const regenerateConfirmOpen = ref(false)

  /** Asks first when it would discard edited drafts. */
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

  /** Clears the drafts on success, so the leave guard lets the page go. */
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

export function useDraftingFlow(options: DraftingFlowOptions) {
  const flow = createDraftingFlow(options)
  const { hasUnsavedWork } = flow.review

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

  // Any close but Discard keeps the page
  watch(leaveConfirmOpen, (open) => {
    if (!open)
      settleLeave(false)
  })

  function confirmLeave() {
    flow.review.clear()
    settleLeave(true)
  }

  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (hasUnsavedWork.value)
      event.preventDefault()
  }
  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

  return { ...flow, leaveConfirmOpen, confirmLeave }
}

export type DraftingFlow = ReturnType<typeof useDraftingFlow>
