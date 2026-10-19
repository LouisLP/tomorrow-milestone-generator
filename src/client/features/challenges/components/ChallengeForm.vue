<script setup lang="ts">
import { LIMITS } from '@shared'
import { nextTick, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import IconChevronUp from '~icons/lucide/chevron-up'
import IconRefresh from '~icons/lucide/refresh-cw'
import IconSparkles from '~icons/lucide/sparkles'
import UniButton from '../../../ui/UniButton.vue'
import UniFormField from '../../../ui/UniFormField.vue'

defineProps<{
  errors: Record<string, string>
  generating: boolean
  atCap: boolean
  drafted: boolean
}>()

const emit = defineEmits<{
  generate: []
  done: []
}>()

const title = defineModel<string>('title', { required: true })
const brief = defineModel<string>('brief', { required: true })

const { t } = useI18n()
const formElement = useTemplateRef('formElement')

async function focusFirstInvalid() {
  await nextTick()
  formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}

async function focus() {
  await nextTick()
  formElement.value?.querySelector<HTMLElement>('input')?.focus()
}

defineExpose({ focus, focusFirstInvalid })
</script>

<template>
  <form ref="formElement" class="form" novalidate @submit.prevent="emit('generate')">
    <UniFormField
      :label="t('challenges.form.title')"
      :error="errors.title"
      :value="title"
      :maxlength="LIMITS.challengeTitle"
      required
    >
      <input v-model="title" type="text" autocomplete="off">
    </UniFormField>
    <UniFormField
      :label="t('challenges.form.brief')"
      :hint="t('challenges.form.briefHint')"
      :error="errors.brief"
      :value="brief"
      :maxlength="LIMITS.brief"
      required
    >
      <textarea v-model="brief" />
    </UniFormField>
    <div class="actions">
      <UniButton
        type="submit"
        size="lg"
        :variant="drafted ? undefined : 'primary'"
        :loading="generating"
        :disabled="atCap"
      >
        <template #icon>
          <IconRefresh v-if="drafted" />
          <IconSparkles v-else />
        </template>
        {{ generating ? t('challenges.form.generating') : drafted ? t('review.regenerate.label') : t('challenges.form.generate') }}
      </UniButton>
      <span v-if="drafted && !generating" class="hint">
        {{ t('review.regenerate.hint') }}
      </span>
      <UniButton v-if="drafted" class="done" variant="ghost" @click="emit('done')">
        <template #icon>
          <IconChevronUp />
        </template>
        {{ t('actions.done') }}
      </UniButton>
    </div>
  </form>
</template>

<style scoped>
.form {
  display: grid;
  gap: var(--space-md);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.done {
  margin-inline-start: auto;
}
</style>
