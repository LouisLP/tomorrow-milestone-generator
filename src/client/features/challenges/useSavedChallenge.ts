// State for the saved side of the detail page (#4, #7): load a Challenge, edit its fields
// and Milestones inline, delete either, append accepted drafts. One instance per page.
import type { ChallengeDetail, Issue, MilestoneContent } from '@shared'
import type { ApiResult, ErrorCode } from '../../api'
import { updateChallengeRequest, updateMilestoneRequest, zodIssues } from '@shared'
import { computed, nextTick, ref, shallowRef } from 'vue'
import * as api from '../../api'

export type ChallengeField = 'title' | 'brief'
export type MilestoneField = 'title' | 'description'

/** Why a field's last save failed. Kept as data so the message follows a language switch. */
export interface FieldFailure {
  code: ErrorCode
  /** The failed check, for `validation_failed` (client-side or from the server). */
  issue?: Issue
}

export type FieldKey = ChallengeField | `milestone.${number}.${MilestoneField}`

export function milestoneFieldKey(milestoneId: number, field: MilestoneField): FieldKey {
  return `milestone.${milestoneId}.${field}`
}

function failure(code: ErrorCode, issues?: Issue[]): FieldFailure {
  return { code, ...(issues?.[0] && { issue: issues[0] }) }
}

export function createSavedChallenge() {
  const challenge = ref<ChallengeDetail | null>(null)
  const loadError = ref<ErrorCode | null>(null)
  const loading = ref(false)
  const fieldFailures = ref<Partial<Record<FieldKey, FieldFailure>>>({})
  const currentId = shallowRef<number | null>(null)

  const canDeleteMilestone = computed(() => (challenge.value?.milestones.length ?? 0) > 1)

  /** Loads `id`; `null` (an id that can't exist) goes straight to `not_found`. */
  async function load(id: number | null) {
    currentId.value = id
    challenge.value = null
    fieldFailures.value = {}
    loadError.value = null
    if (id === null) {
      loadError.value = 'not_found'
      return
    }
    loading.value = true
    const result = await api.getChallenge(id)
    if (currentId.value !== id)
      return
    loading.value = false
    if (result.ok)
      challenge.value = result.data
    else
      loadError.value = result.error.code
  }

  function retry() {
    return load(currentId.value)
  }

  /** Re-reads the Challenge after a change; on failure the local copy stays as it is. */
  async function refresh() {
    const id = currentId.value
    if (id === null)
      return
    const result = await api.getChallenge(id)
    if (result.ok && currentId.value === id)
      challenge.value = result.data
  }

  /**
   * Clears the field's failure, then sets the new one on the next tick, so a repeated
   * identical failure still reads as a change (the inline editor reverts on each change).
   */
  async function setFailure(key: FieldKey, value: FieldFailure | undefined) {
    delete fieldFailures.value[key]
    if (!value)
      return
    await nextTick()
    fieldFailures.value[key] = value
  }

  async function saveChallengeField(field: ChallengeField, value: string) {
    const current = challenge.value
    if (!current)
      return
    await setFailure(field, undefined)
    const parsed = updateChallengeRequest.safeParse({ [field]: value })
    if (!parsed.success)
      return setFailure(field, failure('validation_failed', zodIssues(parsed.error)))
    if (parsed.data[field] === current[field])
      return

    const result = await api.updateChallenge(current.id, parsed.data)
    if (challenge.value?.id !== current.id)
      return
    if (result.ok)
      challenge.value = result.data
    else
      await setFailure(field, failure(result.error.code, result.error.issues))
  }

  async function saveMilestoneField(milestoneId: number, field: MilestoneField, value: string) {
    const current = challenge.value
    const saved = current?.milestones.find(milestone => milestone.id === milestoneId)
    if (!current || !saved)
      return
    const key = milestoneFieldKey(milestoneId, field)
    await setFailure(key, undefined)
    const parsed = updateMilestoneRequest.safeParse({ [field]: value })
    if (!parsed.success)
      return setFailure(key, failure('validation_failed', zodIssues(parsed.error)))
    if (parsed.data[field] === saved[field])
      return

    const result = await api.updateMilestone(current.id, milestoneId, parsed.data)
    if (challenge.value?.id !== current.id)
      return
    if (!result.ok)
      return setFailure(key, failure(result.error.code, result.error.issues))
    const milestones = challenge.value.milestones
    const index = milestones.findIndex(milestone => milestone.id === milestoneId)
    if (index !== -1)
      milestones[index] = result.data
  }

  /** Returns the failure code, or `null` once deleted (positions come back recompacted). */
  async function deleteMilestone(milestoneId: number): Promise<ErrorCode | null> {
    const current = challenge.value
    if (!current)
      return 'not_found'
    const result = await api.deleteMilestone(current.id, milestoneId)
    if (!result.ok)
      return result.error.code
    if (challenge.value?.id === current.id) {
      challenge.value.milestones = challenge.value.milestones.filter(milestone => milestone.id !== milestoneId)
      delete fieldFailures.value[milestoneFieldKey(milestoneId, 'title')]
      delete fieldFailures.value[milestoneFieldKey(milestoneId, 'description')]
    }
    await refresh()
    return null
  }

  /** Adds accepted drafts at the end; on success the page shows the returned Challenge. */
  async function appendMilestones(milestones: MilestoneContent[]): Promise<ApiResult<ChallengeDetail>> {
    const current = challenge.value
    if (!current)
      return { ok: false, error: { code: 'not_found' } }
    const result = await api.appendMilestones(current.id, { milestones })
    if (result.ok && challenge.value?.id === current.id)
      challenge.value = result.data
    return result
  }

  /** Returns the failure code, or `null` once gone (already gone counts as done). */
  async function deleteChallenge(): Promise<ErrorCode | null> {
    const current = challenge.value
    if (!current)
      return 'not_found'
    const result = await api.deleteChallenge(current.id)
    if (!result.ok && result.error.code !== 'not_found')
      return result.error.code
    return null
  }

  return {
    challenge,
    loadError,
    loading,
    fieldFailures,
    canDeleteMilestone,
    load,
    retry,
    saveChallengeField,
    saveMilestoneField,
    deleteMilestone,
    deleteChallenge,
    appendMilestones,
  }
}

export type SavedChallenge = ReturnType<typeof createSavedChallenge>
