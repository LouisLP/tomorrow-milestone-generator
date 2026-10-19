<script setup lang="ts">
import type { Milestone } from '@shared'
import { LIMITS } from '@shared'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconTrash from '~icons/lucide/trash-2'
import { errorMessage } from '../../../i18n'
import UniButton from '../../../ui/UniButton.vue'
import UniConfirmDialog from '../../../ui/UniConfirmDialog.vue'
import UniInlineAlert from '../../../ui/UniInlineAlert.vue'
import UniInlineEditable from '../../../ui/UniInlineEditable.vue'
import UniSpinner from '../../../ui/UniSpinner.vue'
import SavedMilestoneItem from '../components/SavedMilestoneItem.vue'
import { failureMessage } from '../failureMessage'
import { createSavedChallenge, milestoneFieldKey } from '../useSavedChallenge'

const props = defineProps<{ id: string }>()

const { t } = useI18n()
const router = useRouter()

const saved = createSavedChallenge()
const { challenge, loadError, loading, fieldFailures, canDeleteMilestone } = saved

/** Route ids are positive integers; anything else can't exist. */
function parseId(value: string) {
  const id = Number(value)
  return /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : null
}

watch(() => props.id, id => saved.load(parseId(id)), { immediate: true })

const milestonesHeading = useTemplateRef('milestonesHeading')

// Delete Milestone
const milestoneToDelete = ref<Milestone | null>(null)
const deleteMilestoneOpen = computed({
  get: () => milestoneToDelete.value !== null,
  set: (open) => {
    if (!open)
      milestoneToDelete.value = null
  },
})

// The deleted Milestone's button is gone, so the dialog can't hand focus back to it
let focusMilestonesOnClose = false

async function confirmDeleteMilestone() {
  const target = milestoneToDelete.value
  if (!target)
    return
  const code = await saved.deleteMilestone(target.id)
  if (code)
    return errorMessage(code)
  focusMilestonesOnClose = true
}

function onDeleteMilestoneClosed(event: Event) {
  if (!focusMilestonesOnClose)
    return
  focusMilestonesOnClose = false
  event.preventDefault()
  milestonesHeading.value?.focus()
}

// Delete Challenge
const deleteChallengeOpen = ref(false)

async function confirmDeleteChallenge() {
  const code = await saved.deleteChallenge()
  if (code)
    return errorMessage(code)
  await router.push('/')
}
</script>

<template>
  <div class="page">
    <RouterLink class="back" to="/">
      <IconArrowLeft aria-hidden="true" />
      {{ t('actions.backToList') }}
    </RouterLink>

    <section v-if="loadError === 'not_found'" class="state" aria-labelledby="not-found-title">
      <h1 id="not-found-title">
        {{ t('challenges.detail.notFound') }}
      </h1>
      <p>{{ errorMessage('not_found') }}</p>
    </section>

    <template v-else-if="loadError">
      <h1 class="visually-hidden">
        {{ t('challenges.detail.title') }}
      </h1>
      <UniInlineAlert :action-label="t('actions.retry')" :action-loading="loading" @action="saved.retry">
        {{ errorMessage(loadError) }}
      </UniInlineAlert>
    </template>

    <p v-else-if="!challenge" class="loading">
      <UniSpinner :label="t('challenges.detail.loading')" />
    </p>

    <article v-else class="challenge">
      <header class="challenge-header">
        <UniInlineEditable
          as="h1"
          class="challenge-title"
          :value="challenge.title"
          :label="t('challenges.detail.titleLabel')"
          :maxlength="LIMITS.challengeTitle"
          :error="failureMessage(fieldFailures.title, 'challenge')"
          @submit="value => saved.saveChallengeField('title', value)"
        />
        <UniButton intent="danger" @click="deleteChallengeOpen = true">
          <template #icon>
            <IconTrash />
          </template>
          {{ t('challenges.detail.deleteChallenge') }}
        </UniButton>
      </header>

      <section class="section" aria-labelledby="brief-heading">
        <h2 id="brief-heading" class="section-heading">
          {{ t('challenges.detail.brief') }}
        </h2>
        <UniInlineEditable
          as="p"
          class="brief"
          multiline
          :value="challenge.brief"
          :label="t('challenges.detail.brief')"
          :maxlength="LIMITS.brief"
          :error="failureMessage(fieldFailures.brief, 'challenge')"
          @submit="value => saved.saveChallengeField('brief', value)"
        />
        <p class="hint">
          {{ t('challenges.detail.briefHint') }}
        </p>
      </section>

      <section class="section" aria-labelledby="milestones-heading">
        <h2 id="milestones-heading" ref="milestonesHeading" class="section-heading" tabindex="-1">
          {{ t('challenges.detail.milestones') }}
          <span class="count">{{ challenge.milestones.length }}</span>
        </h2>
        <ol class="milestones">
          <SavedMilestoneItem
            v-for="(milestone, index) in challenge.milestones"
            :key="milestone.id"
            :milestone="milestone"
            :n="index + 1"
            :can-delete="canDeleteMilestone"
            :title-error="failureMessage(fieldFailures[milestoneFieldKey(milestone.id, 'title')], 'milestone')"
            :description-error="failureMessage(fieldFailures[milestoneFieldKey(milestone.id, 'description')], 'milestone')"
            @save="(field, value) => saved.saveMilestoneField(milestone.id, field, value)"
            @delete="milestoneToDelete = milestone"
          />
        </ol>
      </section>

      <!-- #19: the append flow (Generate → Review → Save more Milestones) goes here -->
    </article>

    <UniConfirmDialog
      v-model:open="deleteMilestoneOpen"
      intent="danger"
      :title="t('challenges.detail.deleteMilestoneDialog.title')"
      :description="t('challenges.detail.deleteMilestoneDialog.description', { title: milestoneToDelete?.title ?? '' })"
      :confirm-label="t('actions.delete')"
      :cancel-label="t('actions.cancel')"
      :error-fallback="errorMessage('unknown')"
      :confirm="confirmDeleteMilestone"
      @close-auto-focus="onDeleteMilestoneClosed"
    />

    <UniConfirmDialog
      v-if="challenge"
      v-model:open="deleteChallengeOpen"
      intent="danger"
      :title="t('challenges.detail.deleteChallengeDialog.title')"
      :description="t('challenges.detail.deleteChallengeDialog.description', { title: challenge.title, count: challenge.milestones.length }, challenge.milestones.length)"
      :confirm-label="t('challenges.detail.deleteChallenge')"
      :cancel-label="t('actions.cancel')"
      :error-fallback="errorMessage('unknown')"
      :confirm="confirmDeleteChallenge"
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

.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  justify-self: start;
  font-size: var(--font-size-sm);
}

.state {
  display: grid;
  gap: var(--space-sm);
}

.state h1 {
  font-size: var(--font-size-3xl);
}

.loading {
  display: flex;
  justify-content: center;
  padding-block: var(--space-xl);
  font-size: var(--font-size-xl);
}

.challenge {
  display: grid;
  gap: var(--space-xl);
}

.challenge-header {
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-sm);
}

.challenge-title {
  flex: 1 1 20rem;
  min-inline-size: 0;
}

.challenge-title :deep(h1) {
  font-size: var(--font-size-3xl);
  overflow-wrap: anywhere;
}

.section {
  display: grid;
  gap: var(--space-sm);
}

.section-heading {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-xl);
}

.section-heading:focus {
  outline: none;
}

.count {
  padding: 0 var(--space-xs);
  border-radius: var(--radius-full);
  background: var(--color-bg-surface-raised);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  letter-spacing: normal;
}

.brief :deep(p) {
  overflow-wrap: anywhere;
}

.hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.milestones {
  display: grid;
  gap: var(--space-xs);
  padding: 0;
  list-style: none;
}
</style>
