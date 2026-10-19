<!--
  The focus card: the current undecided draft with Reject / Skip / Accept, a skeleton while
  generating, or "All drafts reviewed" with Save once the queue is empty. `focus()` moves
  focus to the card (or to Save when the queue is empty) after a decision or undo.
-->
<script setup lang="ts">
import type { MilestoneContent } from '@shared'
import type { DraftReview } from './useDraftReview'
import { computed, nextTick, onScopeDispose, ref, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IconBan from '~icons/lucide/ban'
import IconCheck from '~icons/lucide/check'
import IconSkip from '~icons/lucide/skip-forward'
import UniBadge from '../../ui/UniBadge.vue'
import UniButton from '../../ui/UniButton.vue'
import UniKbd from '../../ui/UniKbd.vue'
import UniSpinner from '../../ui/UniSpinner.vue'
import DraftEditor from './DraftEditor.vue'

const props = defineProps<{
  review: DraftReview
  saving: boolean
  saveDisabled: boolean
}>()

const emit = defineEmits<{
  accept: []
  reject: []
  skip: []
  edit: [patch: Partial<MilestoneContent>]
  save: []
  cancelGenerate: []
}>()

const STILL_WORKING_AFTER = 10_000

const { t } = useI18n()
const titleId = useId()

const generating = computed(() => props.review.status.value === 'generating')
const current = computed(() => props.review.current.value)
const queue = computed(() => props.review.drafts.value.filter(draft => draft.state === 'undecided'))
// By key: `current` and `drafts` are different proxies of the same draft
const position = computed(() => queue.value.findIndex(draft => draft.key === current.value?.key) + 1)

const stillWorking = ref(false)
let stillWorkingTimer: ReturnType<typeof setTimeout> | undefined
watch(generating, (isGenerating) => {
  clearTimeout(stillWorkingTimer)
  stillWorking.value = false
  if (isGenerating)
    stillWorkingTimer = setTimeout(() => stillWorking.value = true, STILL_WORKING_AFTER)
}, { immediate: true })
onScopeDispose(() => clearTimeout(stillWorkingTimer))

const card = useTemplateRef('card')
const editor = useTemplateRef('editor')
const saveButton = useTemplateRef('saveButton')

async function focus() {
  await nextTick()
  if (generating.value)
    return
  if (current.value)
    card.value?.focus()
  else
    saveButton.value?.$el.focus()
}

defineExpose({
  focus,
  edit: () => editor.value?.edit(),
})
</script>

<template>
  <article v-if="generating" class="card" aria-busy="true">
    <div class="status" role="status">
      <p class="eyebrow">
        <UniSpinner />
        {{ t('review.card.generating') }}
      </p>
      <p v-if="stillWorking" class="hint">
        {{ t('review.card.stillWorking') }}
      </p>
    </div>
    <div class="skeleton" data-shape="title" />
    <div class="skeleton" data-shape="line" />
    <div class="skeleton" data-shape="line" data-short />
    <div class="actions">
      <UniButton size="lg" @click="emit('cancelGenerate')">
        {{ t('actions.cancel') }}
      </UniButton>
    </div>
  </article>

  <article
    v-else-if="current"
    :key="current.key"
    ref="card"
    class="card"
    tabindex="-1"
    :aria-labelledby="titleId"
  >
    <p class="eyebrow">
      {{ t('review.card.position', { n: position, total: queue.length }) }}
      <UniBadge v-if="current.edited">
        {{ t('review.card.edited') }}
      </UniBadge>
      <span class="edit-hint" aria-hidden="true">
        {{ t('review.card.editHint') }} <UniKbd>E</UniKbd>
      </span>
    </p>
    <DraftEditor
      ref="editor"
      :title="current.title"
      :description="current.description"
      :title-id="titleId"
      title-as="h3"
      size="lg"
      @edit="patch => emit('edit', patch)"
    />
    <div class="actions">
      <UniButton size="lg" intent="danger" kbd="R" aria-keyshortcuts="R" @click="emit('reject')">
        <template #icon>
          <IconBan />
        </template>
        {{ t('review.card.reject') }}
      </UniButton>
      <UniButton v-if="queue.length > 1" size="lg" variant="ghost" kbd="S" aria-keyshortcuts="S" @click="emit('skip')">
        <template #icon>
          <IconSkip />
        </template>
        {{ t('review.card.skip') }}
      </UniButton>
      <UniButton class="accept" size="lg" variant="secondary" kbd="A" aria-keyshortcuts="A" @click="emit('accept')">
        <template #icon>
          <IconCheck />
        </template>
        {{ t('review.card.accept') }}
      </UniButton>
    </div>
  </article>

  <article v-else class="card" data-state="done" :aria-labelledby="titleId">
    <h3 :id="titleId" class="done-title">
      {{ t('review.card.doneTitle') }}
    </h3>
    <p class="done-summary">
      {{ t('review.card.doneSummary', { accepted: review.counts.value.accepted, rejected: review.counts.value.rejected }) }}
      <template v-if="review.counts.value.accepted === 0">
        {{ t('review.card.doneEmpty') }}
      </template>
    </p>
    <div class="actions">
      <UniButton
        ref="saveButton"
        variant="primary"
        size="lg"
        :loading="saving"
        :disabled="saveDisabled"
        @click="emit('save')"
      >
        {{ t('review.save.label', review.counts.value.accepted) }}
      </UniButton>
    </div>
  </article>
</template>

<style scoped>
.card {
  display: grid;
  align-content: start;
  gap: var(--space-md);
  min-block-size: 18rem;
  padding: clamp(var(--space-md), 4vw, var(--space-xl));
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-md);
}

/* Focus lands here programmatically; keep the ring on the card's rounded edge */
.card:focus-visible {
  border-radius: var(--radius-lg);
}

@media (prefers-reduced-motion: no-preference) {
  .card {
    animation: enter var(--duration-normal) var(--ease-out);
  }
}

.eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.edit-hint {
  margin-inline-start: auto;
  font-size: var(--font-size-xs);
}

.status {
  display: grid;
  gap: var(--space-2xs);
}

.hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-block-start: auto;
}

.accept {
  margin-inline-start: auto;
}

.skeleton {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--color-bg-surface-raised) 0%,
    var(--color-bg-surface-hover) 50%,
    var(--color-bg-surface-raised) 100%
  );
  background-size: 200% 100%;
}

@media (prefers-reduced-motion: no-preference) {
  .skeleton {
    animation: shimmer 1.2s linear infinite;
  }
}

.skeleton[data-shape='title'] {
  block-size: 2rem;
  inline-size: 60%;
}

.skeleton[data-shape='line'] {
  block-size: 1rem;
  inline-size: 95%;
}

.skeleton[data-short] {
  inline-size: 80%;
}

.card[data-state='done'] {
  place-content: center;
  text-align: center;
}

.card[data-state='done'] .actions {
  justify-content: center;
}

.done-summary {
  color: var(--color-text-secondary);
}

@keyframes enter {
  from {
    opacity: 0;
    translate: 0 var(--space-xs);
  }
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
