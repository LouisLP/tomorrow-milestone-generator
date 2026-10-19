<!--
  One saved Milestone on the detail page: title and description edit inline, the delete
  button asks the page to confirm. `canDelete` false (the last Milestone) disables delete
  and shows why.
-->
<script setup lang="ts">
import type { Milestone } from '@shared'
import type { MilestoneField } from '../useSavedChallenge'
import { LIMITS } from '@shared'
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import IconTrash from '~icons/lucide/trash-2'
import UniButton from '../../../ui/UniButton.vue'
import UniInlineEditable from '../../../ui/UniInlineEditable.vue'

defineProps<{
  milestone: Milestone
  /** 1-based number shown to the user */
  n: number
  canDelete: boolean
  titleError?: string
  descriptionError?: string
}>()

const emit = defineEmits<{
  save: [field: MilestoneField, value: string]
  delete: []
}>()

const { t } = useI18n()
const noteId = useId()
</script>

<template>
  <li class="milestone">
    <span class="number" aria-hidden="true">{{ n }}</span>
    <div class="body">
      <UniInlineEditable
        as="h3"
        class="title"
        :value="milestone.title"
        :label="t('challenges.detail.milestoneTitleLabel', { n })"
        :maxlength="LIMITS.milestoneTitle"
        :error="titleError"
        @submit="value => emit('save', 'title', value)"
      />
      <UniInlineEditable
        as="p"
        class="description"
        multiline
        :value="milestone.description"
        :label="t('challenges.detail.milestoneDescriptionLabel', { n })"
        :maxlength="LIMITS.milestoneDescription"
        :error="descriptionError"
        @submit="value => emit('save', 'description', value)"
      />
      <p v-if="!canDelete" :id="noteId" class="note">
        {{ t('errors.last_milestone') }}
      </p>
    </div>
    <UniButton
      class="delete"
      variant="ghost"
      intent="danger"
      :disabled="!canDelete"
      :aria-label="t('challenges.detail.deleteMilestone', { n })"
      :aria-describedby="canDelete ? undefined : noteId"
      @click="emit('delete')"
    >
      <template #icon>
        <IconTrash />
      </template>
      {{ t('actions.delete') }}
    </UniButton>
  </li>
</template>

<style scoped>
.milestone {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: var(--border-width-thin) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}

.number {
  display: grid;
  place-items: center;
  inline-size: 1.75rem;
  block-size: 1.75rem;
  border-radius: var(--radius-full);
  background: var(--color-bg-surface-raised);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.body {
  display: grid;
  gap: var(--space-2xs);
  min-inline-size: 0;
}

.title :deep(h3) {
  font-size: var(--font-size-lg);
  overflow-wrap: anywhere;
}

.description :deep(p) {
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

.note {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

/* Narrow screens: the delete button drops under the text */
@media (width < 30rem) {
  .milestone {
    grid-template-columns: auto 1fr;
  }

  .delete {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
