<script setup lang="ts">
import type { ChallengeSummary } from '@shared'
import type { ErrorCode } from '../../../api'
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import IconPlus from '~icons/lucide/plus'
import { errorMessage } from '../../../i18n'
import UniConfirmDialog from '../../../ui/UniConfirmDialog.vue'
import UniInlineAlert from '../../../ui/UniInlineAlert.vue'
import UniSpinner from '../../../ui/UniSpinner.vue'
import { deleteChallenge, listChallenges } from '../api/challenges.api'
import ChallengeListItem from '../components/ChallengeListItem.vue'

const { t } = useI18n()

const challenges = ref<ChallengeSummary[] | null>(null)
const error = ref<ErrorCode | null>(null)
const loading = ref(false)
const now = ref(new Date())

async function load() {
  loading.value = true
  error.value = null
  const result = await listChallenges()
  loading.value = false
  now.value = new Date()
  if (result.ok)
    challenges.value = result.data
  else
    error.value = result.error.code
}

onMounted(load)

const challengeToDelete = ref<ChallengeSummary | null>(null)
const deleteOpen = computed({
  get: () => challengeToDelete.value !== null,
  set: (open) => {
    if (!open)
      challengeToDelete.value = null
  },
})

const heading = useTemplateRef('heading')
const list = useTemplateRef('list')
let focusTargetId: number | null = null

async function confirmDelete() {
  const target = challengeToDelete.value
  if (!target)
    return
  const result = await deleteChallenge(target.id)
  if (!result.ok && result.error.code !== 'not_found')
    return errorMessage(result.error.code)
  challenges.value = challenges.value?.filter(challenge => challenge.id !== target.id) ?? null
}

function onDeleteOpen(challenge: ChallengeSummary) {
  focusTargetId = challenge.id
  challengeToDelete.value = challenge
}

// Opened from a context menu, so there's no trigger to return to: back to the row, or the h1 once it's gone
async function onDeleteClosed(event: Event) {
  event.preventDefault()
  await nextTick()
  const row = list.value?.querySelector<HTMLElement>(`[data-challenge-id="${focusTargetId}"]`)
  ;(row ?? heading.value)?.focus()
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 ref="heading" tabindex="-1">
        {{ t('challenges.list.title') }}
      </h1>
      <RouterLink class="button-link" to="/challenges/new">
        <IconPlus aria-hidden="true" />
        {{ t('challenges.list.create') }}
      </RouterLink>
    </header>

    <UniInlineAlert
      v-if="error"
      :action-label="t('actions.retry')"
      :action-loading="loading"
      @action="load"
    >
      {{ errorMessage(error) }}
    </UniInlineAlert>

    <p v-else-if="!challenges" class="loading">
      <UniSpinner :label="t('challenges.list.loading')" />
    </p>

    <section v-else-if="challenges.length === 0" class="empty" aria-labelledby="empty-title">
      <h2 id="empty-title">
        {{ t('challenges.list.empty.title') }}
      </h2>
      <p>{{ t('challenges.list.empty.body') }}</p>
      <RouterLink class="button-link" to="/challenges/new">
        <IconPlus aria-hidden="true" />
        {{ t('challenges.list.create') }}
      </RouterLink>
    </section>

    <ul v-else ref="list" class="list">
      <ChallengeListItem
        v-for="challenge in challenges"
        :key="challenge.id"
        :challenge="challenge"
        :now="now"
        @delete="onDeleteOpen(challenge)"
      />
    </ul>

    <UniConfirmDialog
      v-model:open="deleteOpen"
      intent="danger"
      :title="t('challenges.detail.deleteChallengeDialog.title')"
      :description="t('challenges.detail.deleteChallengeDialog.description', { title: challengeToDelete?.title ?? '', count: challengeToDelete?.milestoneCount ?? 0 }, challengeToDelete?.milestoneCount ?? 0)"
      :confirm-label="t('challenges.detail.deleteChallenge')"
      :cancel-label="t('actions.cancel')"
      :error-fallback="errorMessage('unknown')"
      :confirm="confirmDelete"
      @close-auto-focus="onDeleteClosed"
    />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-lg);
  max-inline-size: 48rem;
  margin-inline: auto;
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

/* Looks like a primary UniButton, but navigates, so it stays an <a> */
.button-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-2xs) var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--color-accent-default);
  color: var(--color-text-on-accent);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  white-space: nowrap;
  transition: background var(--duration-fast) var(--ease-out);
}

.button-link:hover {
  background: var(--color-accent-hover);
  color: var(--color-text-on-accent);
}

.button-link svg {
  inline-size: 0.875em;
  block-size: 0.875em;
}

.loading {
  display: flex;
  justify-content: center;
  padding-block: var(--space-xl);
  font-size: var(--font-size-xl);
}

.empty {
  display: grid;
  justify-items: start;
  gap: var(--space-sm);
  padding: var(--space-xl) var(--space-lg);
  border: var(--border-width-thin) dashed var(--color-border-default);
  border-radius: var(--radius-lg);
}

.empty h2 {
  font-size: var(--font-size-xl);
}

.empty p {
  color: var(--color-text-secondary);
  text-wrap: pretty;
}

.list {
  display: grid;
  gap: var(--space-xs);
  padding: 0;
  list-style: none;
}
</style>
