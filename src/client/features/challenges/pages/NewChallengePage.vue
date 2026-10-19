<!--
  New Challenge (#4, #6, #7): title + Brief → Generate → review queue → Save → detail page.
  Nothing is persisted before Save. Once drafts exist the form folds to a one-line strip
  and the review queue owns the page.
-->
<script setup lang="ts">
import type { MilestoneContent } from '@shared'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconPencil from '~icons/lucide/pencil'
import IconRefresh from '~icons/lucide/refresh-cw'
import { createChallenge } from '../../../api'
import { fieldErrors } from '../../../i18n'
import UniButton from '../../../ui/UniButton.vue'
import DraftingDialogs from '../../review/DraftingDialogs.vue'
import ReviewQueue from '../../review/ReviewQueue.vue'
import { useDraftingFlow } from '../../review/useDraftingFlow'
import ChallengeForm from '../components/ChallengeForm.vue'

const { t } = useI18n()
const router = useRouter()

const details = ref({ title: '', brief: '' })
const flow = useDraftingFlow({ details })
const { review, saving, saveError } = flow

const errors = computed(() => fieldErrors(flow.issues.value))

const generating = computed(() => review.status.value === 'generating')
const drafted = computed(() => review.drafts.value.length > 0)

// Once drafts exist the form folds to the strip; Edit details opens it again
const detailsOpen = ref(false)
const showForm = computed(() => !drafted.value || detailsOpen.value)

const form = useTemplateRef('form')
const editDetailsButton = useTemplateRef('editDetailsButton')

/** Opens the form with its field errors and focuses the first one. */
async function showErrors() {
  // Before drafts exist the form is already showing; opening it would keep it from folding later
  if (drafted.value)
    detailsOpen.value = true
  await nextTick()
  await form.value?.focusFirstInvalid()
}

function onGenerate() {
  const valid = drafted.value ? flow.regenerate() : flow.generate()
  if (!valid)
    void showErrors()
}

async function onEditDetails() {
  detailsOpen.value = true
  await nextTick()
  await form.value?.focus()
}

async function onDone() {
  detailsOpen.value = false
  await nextTick()
  editDetailsButton.value?.$el.focus()
}

async function onSave(accepted: MilestoneContent[]) {
  const input = flow.validate()
  if (!input)
    return showErrors()
  const result = await flow.save(() => createChallenge({ ...input, milestones: accepted }))
  if (!result)
    return
  if (result.ok)
    await router.push({ name: 'challenge-detail', params: { id: result.data.id } })
  else if (flow.issues.value.length > 0)
    await showErrors()
}
</script>

<template>
  <div class="page">
    <RouterLink class="back" to="/">
      <IconArrowLeft aria-hidden="true" />
      {{ t('actions.backToList') }}
    </RouterLink>

    <h1 :class="{ compact: drafted }">
      {{ t('challenges.new.title') }}
    </h1>

    <ChallengeForm
      v-if="showForm"
      ref="form"
      v-model:title="details.title"
      v-model:brief="details.brief"
      :errors="errors"
      :generating="generating"
      :at-cap="review.atCap.value"
      :drafted="drafted"
      @generate="onGenerate"
      @done="onDone"
    />

    <section v-else class="strip" :aria-label="t('challenges.new.detailsLabel')">
      <p class="strip-text">
        <strong class="strip-title">{{ details.title }}</strong>
        <span class="strip-brief">{{ details.brief }}</span>
      </p>
      <UniButton ref="editDetailsButton" variant="ghost" @click="onEditDetails">
        <template #icon>
          <IconPencil />
        </template>
        {{ t('challenges.new.editDetails') }}
      </UniButton>
      <UniButton :loading="generating" :disabled="review.atCap.value" @click="onGenerate">
        <template #icon>
          <IconRefresh />
        </template>
        {{ generating ? t('challenges.form.generating') : t('review.regenerate.label') }}
      </UniButton>
    </section>

    <ReviewQueue
      :review="review"
      :saving="saving"
      :save-error="saveError"
      @save="onSave"
      @retry-generate="onGenerate"
      @cancel-generate="flow.cancel"
    />

    <DraftingDialogs :flow="flow" />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  /* minmax(0, …): the strip's nowrap text must not widen the page */
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-lg);
  max-inline-size: 72rem;
  margin-inline: auto;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  justify-self: start;
  font-size: var(--font-size-sm);
}

h1 {
  font-size: var(--font-size-3xl);
  transition: font-size var(--duration-normal) var(--ease-out);
}

h1.compact {
  font-size: var(--font-size-xl);
}

.strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border: var(--border-width-thin) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}

.strip-text {
  display: flex;
  flex: 1 1 16rem;
  align-items: baseline;
  gap: var(--space-sm);
  min-inline-size: 0;
}

.strip-title,
.strip-brief {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.strip-title {
  flex-shrink: 0;
  max-inline-size: 100%;
}

.strip-brief {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
