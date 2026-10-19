import type { ChallengeDetail, Issue, MilestoneContent } from '@shared'
import type { ApiResult, ErrorCode } from '../../../api'
import type { ChallengeField, FieldFailure, FieldKey, MilestoneField } from '../types/challenge.types'
import { updateChallengeRequest, updateMilestoneRequest, zodIssues } from '@shared'
import { computed, nextTick, ref, shallowRef } from 'vue'
import * as api from '../api/challenges.api'
import { milestoneFieldKey } from '../utils/fieldKey.utils'

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

  /** `null` (an id that can't exist) is `not_found` without a request. */
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

  /** On failure the local copy stays. */
  async function refresh() {
    const id = currentId.value
    if (id === null)
      return
    const result = await api.getChallenge(id)
    if (result.ok && currentId.value === id)
      challenge.value = result.data
  }

  // Set on the next tick so a repeated identical failure still makes the inline editor revert
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

  /** The failure code, or `null` once deleted. */
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

  async function appendMilestones(milestones: MilestoneContent[]): Promise<ApiResult<ChallengeDetail>> {
    const current = challenge.value
    if (!current)
      return { ok: false, error: { code: 'not_found' } }
    const result = await api.appendMilestones(current.id, { milestones })
    if (result.ok && challenge.value?.id === current.id)
      challenge.value = result.data
    return result
  }

  /** The failure code, or `null` once gone (already gone counts). */
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
