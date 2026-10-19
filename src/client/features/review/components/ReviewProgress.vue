<script setup lang="ts">
import type { DraftReview } from '../composables/useDraftReview'
import { GENERATED_MIN } from '@shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import IconCheckCheck from '~icons/lucide/check-check'
import UniButton from '../../../ui/UniButton.vue'

const props = defineProps<{ review: DraftReview }>()

const emit = defineEmits<{
  select: [key: string]
  acceptRemaining: []
}>()

type SegmentState = 'undecided' | 'accepted' | 'rejected' | 'skipped' | 'generating'

interface Segment {
  key: string
  title?: string
  state: SegmentState
}

const { t } = useI18n()

const generating = computed(() => props.review.status.value === 'generating')

const aiDrafts = computed(() => props.review.drafts.value.filter(draft => draft.origin === 'ai'))

const segments = computed<Segment[]>(() => {
  const real = aiDrafts.value.map(({ key, title, state, skipped }): Segment => ({
    key,
    title,
    state: state === 'undecided' && skipped ? 'skipped' : state,
  }))
  if (!generating.value)
    return real
  // All but accepted drafts are about to be replaced
  const placeholders = Array.from({ length: GENERATED_MIN }, (_, i): Segment => ({ key: `generating-${i}`, state: 'generating' }))
  return [...real.filter(segment => segment.state === 'accepted'), ...placeholders]
})

const tally = computed(() => {
  const result = { accepted: 0, rejected: 0, skipped: 0 }
  for (const { state } of segments.value) {
    if (state === 'accepted' || state === 'rejected' || state === 'skipped')
      result[state]++
  }
  return result
})

const reviewed = computed(() => tally.value.accepted + tally.value.rejected)
const currentKey = computed(() => props.review.current.value?.key)
</script>

<template>
  <div class="progress">
    <nav :aria-label="t('review.progress.label')">
      <ol class="segments">
        <li v-for="(segment, index) in segments" :key="segment.key">
          <button
            type="button"
            class="segment"
            :data-state="segment.state"
            :disabled="segment.state === 'generating'"
            :aria-current="!generating && segment.key === currentKey ? 'step' : undefined"
            :aria-label="t('review.progress.segment', {
              n: index + 1,
              total: segments.length,
              state: t(`review.progress.states.${segment.state}`),
            })"
            :title="segment.title"
            @click="emit('select', segment.key)"
          />
        </li>
      </ol>
    </nav>
    <div v-if="!generating" class="summary">
      <p class="tally">
        <span>{{ t('review.progress.reviewed', { reviewed, total: segments.length }) }}</span>
        <template v-for="(count, state) in tally" :key="state">
          <span v-if="count > 0" class="legend" :data-state="state">
            {{ t(`review.progress.legend.${state}`, { n: count }) }}
          </span>
        </template>
      </p>
      <UniButton v-if="review.undecidedCount.value > 1" variant="ghost" @click="emit('acceptRemaining')">
        <template #icon>
          <IconCheckCheck />
        </template>
        {{ t('review.progress.acceptRemaining', { n: review.undecidedCount.value }) }}
      </UniButton>
    </div>
  </div>
</template>

<style scoped>
.progress {
  display: grid;
  gap: var(--space-2xs);
}

.segments {
  display: flex;
  gap: 3px;
  padding: 0;
  list-style: none;
}

.segments > li {
  flex: 1;
}

/* Fixed hit area; the bar is ::before so rings never shift layout */
.segment {
  --bar: 6px;
  --hit: 1.25rem;

  display: block;
  inline-size: 100%;
  block-size: var(--hit);
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.segment:disabled {
  cursor: progress;
}

.segment::before {
  content: '';
  display: block;
  block-size: var(--bar);
  margin-block: calc((var(--hit) - var(--bar)) / 2);
  border-radius: var(--radius-full);
  background: var(--color-bg-surface-hover);
  transition:
    background var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.segment[data-state='accepted']::before {
  background: var(--color-success-default);
}

.segment[data-state='rejected']::before {
  background: var(--color-danger-default);
}

.segment[data-state='skipped']::before {
  background: var(--color-warning-default);
}

.segment[data-state='generating']::before {
  background: linear-gradient(
    90deg,
    var(--color-bg-surface-raised),
    var(--color-bg-surface-hover),
    var(--color-bg-surface-raised)
  );
  background-size: 200% 100%;
}

@media (prefers-reduced-motion: no-preference) {
  .segment[data-state='generating']::before {
    animation: shimmer 1.2s linear infinite;
  }
}

.segment:hover:not(:disabled)::before {
  box-shadow: 0 0 0 2px var(--color-border-default);
}

.segment[aria-current='step']::before {
  box-shadow:
    0 0 0 2px var(--color-bg-canvas),
    0 0 0 3px var(--color-text-secondary);
}

.segment:focus-visible {
  outline: none;
}

.segment:focus-visible::before {
  box-shadow:
    0 0 0 2px var(--color-bg-canvas),
    0 0 0 4px var(--color-focus-ring);
}

.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  min-block-size: 2rem;
}

.tally {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2xs) var(--space-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
}

.legend {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
}

.legend::before {
  content: '';
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: var(--radius-full);
}

.legend[data-state='accepted']::before {
  background: var(--color-success-default);
}

.legend[data-state='rejected']::before {
  background: var(--color-danger-default);
}

.legend[data-state='skipped']::before {
  background: var(--color-warning-default);
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
