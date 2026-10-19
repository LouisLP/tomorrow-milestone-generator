<!--
  Side rail: Accepted drafts (expand a row to edit it in place), Add your own, Rejected
  drafts, and Save. Every change is emitted; ReviewQueue applies it.
-->
<script setup lang="ts">
import type { MilestoneContent } from '@shared'
import type { ErrorCode } from '../../api'
import type { Draft, DraftReview } from './useDraftReview'
import { MILESTONE_CAP } from '@shared'
import { computed, nextTick, ref, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import IconChevronUp from '~icons/lucide/chevron-up'
import IconPlus from '~icons/lucide/plus'
import IconTrash from '~icons/lucide/trash-2'
import IconUndo from '~icons/lucide/undo-2'
import { errorMessage } from '../../i18n'
import UniBadge from '../../ui/UniBadge.vue'
import UniButton from '../../ui/UniButton.vue'
import UniInlineAlert from '../../ui/UniInlineAlert.vue'
import AddDraftDialog from './AddDraftDialog.vue'
import DraftEditor from './DraftEditor.vue'

const props = defineProps<{
  review: DraftReview
  saving: boolean
  saveError: ErrorCode | null
  saveDisabled: boolean
  savedCount: number
}>()

const emit = defineEmits<{
  edit: [key: string, patch: Partial<MilestoneContent>]
  reset: [key: string]
  remove: [key: string]
  add: [content: MilestoneContent]
  save: []
  retrySave: []
}>()

const { t } = useI18n()
const acceptedHeadingId = useId()
const rejectedHeadingId = useId()

const accepted = computed(() => props.review.drafts.value.filter(draft => draft.state === 'accepted'))
const rejected = computed(() => props.review.drafts.value.filter(draft => draft.state === 'rejected'))
const generating = computed(() => props.review.status.value === 'generating')
const acceptedCount = computed(() => props.review.counts.value.accepted)
const roomLeft = computed(() => Math.max(0, MILESTONE_CAP - props.savedCount))

const expandedKey = ref<string | null>(null)
const acceptedList = useTemplateRef('acceptedList')

async function toggle(draft: Draft) {
  const opening = expandedKey.value !== draft.key
  expandedKey.value = opening ? draft.key : null
  // The toggle is swapped for another element, so hand focus to its counterpart
  await nextTick()
  acceptedList.value
    ?.querySelector<HTMLElement>(`[data-key="${draft.key}"] [data-role="toggle"]`)
    ?.focus()
}

const addOpen = ref(false)
</script>

<template>
  <aside class="rail" :aria-label="t('review.rail.label')">
    <section class="group" :aria-labelledby="acceptedHeadingId">
      <h3 :id="acceptedHeadingId" class="heading">
        {{ t('review.rail.accepted') }}
        <span class="count">{{ accepted.length }}</span>
      </h3>
      <ol ref="acceptedList" class="rows">
        <li
          v-for="draft in accepted"
          :key="draft.key"
          class="row"
          data-state="accepted"
          :data-key="draft.key"
          :data-open="expandedKey === draft.key || undefined"
        >
          <template v-if="expandedKey === draft.key">
            <div class="row-head">
              <DraftEditor
                class="row-editor"
                :title="draft.title"
                :description="draft.description"
                @edit="patch => emit('edit', draft.key, patch)"
              />
              <UniBadge v-if="draft.origin === 'staff'" tone="success">
                {{ t('review.rail.yours') }}
              </UniBadge>
              <UniButton
                class="icon-button"
                variant="ghost"
                data-role="toggle"
                aria-expanded="true"
                :aria-label="t('review.rail.collapse')"
                @click="toggle(draft)"
              >
                <template #icon>
                  <IconChevronUp />
                </template>
              </UniButton>
            </div>
            <div class="row-actions">
              <UniButton v-if="draft.origin === 'ai'" variant="ghost" :disabled="generating" @click="emit('reset', draft.key)">
                <template #icon>
                  <IconUndo />
                </template>
                {{ t('review.rail.backToQueue') }}
              </UniButton>
              <UniButton v-else variant="ghost" intent="danger" @click="emit('remove', draft.key)">
                <template #icon>
                  <IconTrash />
                </template>
                {{ t('review.rail.remove') }}
              </UniButton>
            </div>
          </template>
          <div v-else class="row-head">
            <button
              type="button"
              class="row-title"
              data-role="toggle"
              aria-expanded="false"
              @click="toggle(draft)"
            >
              {{ draft.title }}
            </button>
            <UniBadge v-if="draft.origin === 'staff'" tone="success">
              {{ t('review.rail.yours') }}
            </UniBadge>
            <UniButton
              v-if="draft.origin === 'ai'"
              class="icon-button"
              variant="ghost"
              :disabled="generating"
              :aria-label="t('review.rail.backToQueueNamed', { title: draft.title })"
              :title="t('review.rail.backToQueue')"
              @click="emit('reset', draft.key)"
            >
              <template #icon>
                <IconUndo />
              </template>
            </UniButton>
          </div>
        </li>
        <li v-if="accepted.length === 0" class="empty">
          {{ t('review.rail.empty') }}
        </li>
      </ol>
      <UniButton class="add" variant="ghost" :disabled="generating" @click="addOpen = true">
        <template #icon>
          <IconPlus />
        </template>
        {{ t('review.rail.addOwn') }}
      </UniButton>
    </section>

    <section class="group" :aria-labelledby="rejectedHeadingId">
      <h3 :id="rejectedHeadingId" class="heading">
        {{ t('review.rail.rejected') }}
        <span class="count">{{ rejected.length }}</span>
      </h3>
      <ol class="rows">
        <li v-for="draft in rejected" :key="draft.key" class="row" data-state="rejected">
          <div class="row-head">
            <s class="row-title">{{ draft.title }}</s>
            <UniButton
              class="icon-button"
              variant="ghost"
              :disabled="generating"
              :aria-label="t('review.rail.backToQueueNamed', { title: draft.title })"
              :title="t('review.rail.backToQueue')"
              @click="emit('reset', draft.key)"
            >
              <template #icon>
                <IconUndo />
              </template>
            </UniButton>
          </div>
        </li>
        <li v-if="rejected.length === 0" class="empty">
          {{ t('review.rail.empty') }}
        </li>
      </ol>
    </section>

    <footer class="save">
      <UniButton variant="ghost" :loading="saving" :disabled="saveDisabled" @click="emit('save')">
        {{ t('review.save.label', acceptedCount) }}
      </UniButton>
      <p v-if="review.overCap.value" class="note" data-tone="warning">
        {{ t('review.save.overCap', { cap: MILESTONE_CAP }, roomLeft) }}
      </p>
      <p v-else-if="review.undecidedCount.value > 0" class="note">
        {{ t('review.save.undecided', { n: review.undecidedCount.value }) }}
      </p>
      <UniInlineAlert
        v-if="saveError"
        class="save-alert"
        :action-label="t('actions.retry')"
        :action-loading="saving"
        @action="emit('retrySave')"
      >
        {{ errorMessage(saveError) }}
      </UniInlineAlert>
    </footer>

    <AddDraftDialog v-model:open="addOpen" @add="content => emit('add', content)" />
  </aside>
</template>

<style scoped>
.rail {
  display: grid;
  align-content: start;
  gap: var(--space-lg);
}

.group {
  display: grid;
  gap: var(--space-xs);
}

.heading {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-md);
}

.count {
  color: var(--color-text-muted);
  font-family: var(--font-code);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
}

.rows {
  display: grid;
  gap: var(--space-2xs);
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-2xs) var(--space-xs);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.row[data-state='accepted'] {
  background: var(--color-success-subtle-bg);
}

.row[data-state='rejected'] {
  background: var(--color-danger-subtle-bg);
  color: var(--color-danger-subtle-fg);
}

.row[data-open] {
  padding: var(--space-xs);
  outline: var(--border-width-thin) solid var(--color-secondary-border);
}

.row-head {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
}

.row[data-open] .row-head {
  align-items: start;
}

.row-title {
  flex: 1;
  min-inline-size: 0;
  padding: var(--space-2xs) 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  overflow-wrap: anywhere;
}

button.row-title {
  cursor: pointer;
}

button.row-title:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

s.row-title {
  text-decoration-color: oklch(from currentcolor l c h / 0.5);
}

.row-editor {
  flex: 1;
  min-inline-size: 0;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
}

.icon-button {
  flex-shrink: 0;
  padding: var(--space-2xs);
}

.empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.add {
  justify-self: start;
}

.save {
  display: grid;
  justify-items: center;
  gap: var(--space-2xs);
  padding-block-start: var(--space-md);
  border-block-start: var(--border-width-thin) solid var(--color-border-subtle);
  text-align: center;
}

.save-alert {
  justify-self: stretch;
  text-align: start;
}

.note {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.note[data-tone='warning'] {
  color: var(--color-warning-subtle-fg);
}
</style>
