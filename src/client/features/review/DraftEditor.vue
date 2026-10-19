<!--
  A Draft Milestone's title + description, both click-to-edit. Enter or blur submits the
  title, blur submits the description, Esc cancels. An emptied field reverts with an error
  instead of submitting. `size="lg"` is the focus card; the default is the side rail.
-->
<script setup lang="ts">
import type { MilestoneContent } from '@shared'
import { LIMITS } from '@shared'
import { nextTick, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import UniInlineEditable from '../../ui/UniInlineEditable.vue'

withDefaults(defineProps<{
  title: string
  description: string
  size?: 'md' | 'lg'
  /** Element the title renders as, e.g. 'h3' on the focus card */
  titleAs?: string
  /** Lets a parent point aria-labelledby at the title */
  titleId?: string
}>(), {
  size: 'md',
  titleAs: 'span',
})

const emit = defineEmits<{ edit: [patch: Partial<MilestoneContent>] }>()

const { t } = useI18n()

const errors = ref<Partial<Record<keyof MilestoneContent, string>>>({})
const titleField = useTemplateRef('titleField')

async function submit(field: keyof MilestoneContent, value: string) {
  // Clear first so the same error set again still makes the field revert
  errors.value[field] = undefined
  if (value.trim()) {
    emit('edit', { [field]: value })
    return
  }
  await nextTick()
  errors.value[field] = t('validation.required')
}

defineExpose({ edit: () => titleField.value?.edit() })
</script>

<template>
  <div class="draft" :data-size="size">
    <UniInlineEditable
      :id="titleId"
      ref="titleField"
      class="title"
      :value="title"
      :label="t('review.fields.title')"
      :maxlength="LIMITS.milestoneTitle"
      :as="titleAs"
      :error="errors.title"
      @submit="value => submit('title', value)"
    />
    <UniInlineEditable
      class="description"
      :value="description"
      :label="t('review.fields.description')"
      :maxlength="LIMITS.milestoneDescription"
      :error="errors.description"
      as="p"
      multiline
      @submit="value => submit('description', value)"
    />
  </div>
</template>

<style scoped>
.draft {
  display: grid;
  gap: var(--space-2xs);
}

.title {
  font-weight: var(--font-weight-semibold);
}

.description {
  color: var(--color-text-secondary);
}

.draft[data-size='lg'] {
  gap: var(--space-md);
}

.draft[data-size='lg'] .title {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  text-wrap: balance;
}

.draft[data-size='lg'] .description {
  max-inline-size: 60ch;
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  text-wrap: pretty;
}
</style>
