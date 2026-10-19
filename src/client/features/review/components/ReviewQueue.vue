<script setup lang="ts">
import type { MilestoneContent } from '@shared'
import type { ErrorCode } from '../../../api'
import type { SnackbarNotice } from '../../../ui/UniSnackbar.vue'
import type { DraftReview } from '../composables/useDraftReview'
import type { ReviewAction } from '../types/draft.types'
import { computed, ref, useId, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { errorMessage } from '../../../i18n'
import UniConfirmDialog from '../../../ui/UniConfirmDialog.vue'
import UniInlineAlert from '../../../ui/UniInlineAlert.vue'
import UniSnackbar from '../../../ui/UniSnackbar.vue'
import { isApplePlatform, useReviewShortcuts } from '../composables/useReviewShortcuts'
import ReviewFocusCard from './ReviewFocusCard.vue'
import ReviewProgress from './ReviewProgress.vue'
import ReviewRail from './ReviewRail.vue'

const props = withDefaults(defineProps<{
  review: DraftReview
  saving?: boolean
  saveError?: ErrorCode | null
  savedCount?: number
}>(), {
  saving: false,
  saveError: null,
  savedCount: 0,
})

const emit = defineEmits<{
  save: [accepted: MilestoneContent[]]
  retryGenerate: []
  cancelGenerate: []
}>()

const { t } = useI18n()
const headingId = useId()

const status = computed(() => props.review.status.value)
const generating = computed(() => status.value === 'generating')
const hasAiDrafts = computed(() => props.review.drafts.value.some(draft => draft.origin === 'ai'))

// Field errors belong to the form; a cancel isn't an error
const generateError = computed(() => {
  const code = props.review.error.value
  return code && code !== 'validation_failed' && code !== 'aborted' ? code : null
})

const saveDisabled = computed(() =>
  generating.value || props.review.counts.value.accepted === 0 || props.review.overCap.value,
)

const notice = ref<SnackbarNotice>()
let noticeId = 0
const undoLabel = computed(() => t('review.notice.undo', { shortcut: isApplePlatform ? '⌘Z' : 'Ctrl+Z' }))

function describe(action: ReviewAction) {
  if (action.kind === 'acceptRemaining')
    return t('review.notice.acceptRemaining', action.count)
  return t(`review.notice.${action.kind}`, { title: action.title })
}

function notify(message: string) {
  notice.value = {
    id: ++noticeId,
    message,
    actionLabel: props.review.canUndo.value ? undoLabel.value : undefined,
  }
}

const focusCard = useTemplateRef('focusCard')

/** Announces the change in the snackbar if it was recorded (so it's undoable). */
function run(change: () => void, { moveFocus = false } = {}) {
  const before = props.review.lastAction.value
  change()
  const after = props.review.lastAction.value
  if (after && after !== before)
    notify(describe(after))
  if (moveFocus)
    focusCard.value?.focus()
}

function decideCurrent(decision: 'accept' | 'reject' | 'skip') {
  const key = props.review.current.value?.key
  if (key && !generating.value)
    run(() => props.review[decision](key), { moveFocus: true })
}

function editCurrent(patch: Partial<MilestoneContent>) {
  const key = props.review.current.value?.key
  if (key)
    run(() => props.review.edit(key, patch))
}

function undo() {
  if (!props.review.canUndo.value)
    return
  props.review.undo()
  notify(t('review.notice.undone'))
  focusCard.value?.focus()
}

const confirmOpen = ref(false)

function save() {
  if (props.saving || saveDisabled.value)
    return
  if (props.review.undecidedCount.value > 0)
    confirmOpen.value = true
  else
    emit('save', props.review.accepted.value)
}

function confirmSave() {
  emit('save', props.review.accepted.value)
}

useReviewShortcuts({
  accept: () => decideCurrent('accept'),
  reject: () => decideCurrent('reject'),
  skip: () => {
    if (props.review.undecidedCount.value > 1)
      decideCurrent('skip')
  },
  edit: () => focusCard.value?.edit(),
  undo,
})
</script>

<template>
  <section v-if="status !== 'idle' || generateError" class="review" :aria-labelledby="headingId">
    <h2 :id="headingId" class="visually-hidden">
      {{ t('review.heading') }}
    </h2>

    <div class="layout">
      <div class="stage">
        <UniInlineAlert
          v-if="generateError"
          :action-label="t('actions.retry')"
          @action="emit('retryGenerate')"
        >
          {{ errorMessage(generateError) }}
        </UniInlineAlert>
        <template v-if="status !== 'idle'">
          <ReviewProgress
            v-if="hasAiDrafts || generating"
            :review="review"
            @select="key => run(() => review.select(key))"
            @accept-remaining="run(review.acceptRemaining, { moveFocus: true })"
          />
          <ReviewFocusCard
            ref="focusCard"
            :review="review"
            :saving="saving"
            :save-disabled="saveDisabled"
            @accept="decideCurrent('accept')"
            @reject="decideCurrent('reject')"
            @skip="decideCurrent('skip')"
            @edit="editCurrent"
            @save="save"
            @cancel-generate="emit('cancelGenerate')"
          />
        </template>
      </div>

      <ReviewRail
        v-if="status !== 'idle'"
        class="rail"
        :review="review"
        :saving="saving"
        :save-error="saveError"
        :save-disabled="saveDisabled"
        :saved-count="savedCount"
        @edit="(key, patch) => run(() => review.edit(key, patch))"
        @reset="key => run(() => review.reset(key), { moveFocus: true })"
        @remove="key => run(() => review.removeStaffDraft(key), { moveFocus: true })"
        @add="content => run(() => review.addStaffDraft(content))"
        @save="save"
        @retry-save="emit('save', review.accepted.value)"
      />
    </div>

    <UniSnackbar v-model:notice="notice" @action="undo" />

    <UniConfirmDialog
      v-model:open="confirmOpen"
      :title="t('review.save.confirmTitle', review.undecidedCount.value)"
      :description="t('review.save.confirmDescription')"
      :confirm-label="t('review.save.confirmLabel')"
      :cancel-label="t('actions.cancel')"
      intent="danger"
      :confirm="confirmSave"
    />
  </section>
</template>

<style scoped>
.review {
  container-type: inline-size;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: var(--space-xl);
}

.stage {
  display: grid;
  gap: var(--space-sm);
}

@container (min-width: 52rem) {
  .layout {
    grid-template-columns: minmax(0, 1fr) 18rem;
  }

  .rail {
    position: sticky;
    inset-block-start: var(--space-lg);
  }
}
</style>
