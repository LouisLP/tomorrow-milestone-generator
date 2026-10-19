<!--
  "Write your own milestone" (Reka Dialog). Both fields are required, checked with the shared
  schema on submit and live after that. Cancel/Esc adds nothing.
-->
<script setup lang="ts">
import type { MilestoneContent } from '@shared'
import { LIMITS, milestoneContent } from '@shared'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IconCheck from '~icons/lucide/check'
import { fieldErrors } from '../../i18n'
import UniButton from '../../ui/UniButton.vue'
import UniFormField from '../../ui/UniFormField.vue'

const emit = defineEmits<{ add: [content: MilestoneContent] }>()

const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()

const form = ref<MilestoneContent>({ title: '', description: '' })
const submitted = ref(false)
const formElement = useTemplateRef('formElement')

watch(open, (isOpen) => {
  if (!isOpen)
    return
  form.value = { title: '', description: '' }
  submitted.value = false
})

const result = computed(() => milestoneContent.safeParse(form.value))
const errors = computed(() =>
  submitted.value && !result.value.success ? fieldErrors(result.value.error, 'milestone') : {},
)

async function onSubmit() {
  submitted.value = true
  if (!result.value.success) {
    await nextTick()
    formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  emit('add', result.value.data)
  open.value = false
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="overlay" />
      <DialogContent class="content">
        <DialogTitle class="title">
          {{ t('review.add.title') }}
        </DialogTitle>
        <DialogDescription class="description">
          {{ t('review.add.description') }}
        </DialogDescription>
        <form ref="formElement" class="form" novalidate @submit.prevent="onSubmit">
          <UniFormField
            :label="t('review.fields.title')"
            :error="errors.title"
            :value="form.title"
            :maxlength="LIMITS.milestoneTitle"
            required
          >
            <input v-model="form.title" type="text" autocomplete="off">
          </UniFormField>
          <UniFormField
            :label="t('review.fields.description')"
            :error="errors.description"
            :value="form.description"
            :maxlength="LIMITS.milestoneDescription"
            required
          >
            <textarea v-model="form.description" />
          </UniFormField>
          <div class="actions">
            <DialogClose as-child>
              <UniButton>{{ t('actions.cancel') }}</UniButton>
            </DialogClose>
            <UniButton type="submit" variant="secondary">
              <template #icon>
                <IconCheck />
              </template>
              {{ t('review.add.submit') }}
            </UniButton>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: oklch(0% 0 0 / 0.55);
}

.content {
  position: fixed;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  z-index: var(--z-modal);
  display: grid;
  gap: var(--space-md);
  inline-size: min(30rem, 100vw - 2 * var(--space-md));
  max-block-size: calc(100dvh - 2 * var(--space-md));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--space-lg);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-lg);
  translate: -50% -50%;
}

.title {
  font-size: var(--font-size-xl);
  text-wrap: balance;
}

.description {
  color: var(--color-text-secondary);
  text-wrap: pretty;
}

.form {
  display: grid;
  gap: var(--space-md);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-xs);
}
</style>
