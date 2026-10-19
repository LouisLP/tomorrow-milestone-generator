<!-- Pass `value` and `maxlength` for a counter past 80% of the limit. -->
<script setup lang="ts">
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<{
  label: string
  error?: string
  hint?: string
  value?: string
  maxlength?: number
  required?: boolean
  disabled?: boolean
}>()

defineSlots<{ default: () => unknown }>()

const COUNTER_THRESHOLD = 0.8

const length = computed(() => props.value?.length ?? 0)
const showCounter = computed(() => !!props.maxlength && length.value > props.maxlength * COUNTER_THRESHOLD)
</script>

<template>
  <FieldRoot class="field" :invalid="!!error" :required="required" :disabled="disabled">
    <FieldLabel class="label">
      {{ label }}
    </FieldLabel>
    <FieldControl as-child :maxlength="maxlength">
      <slot />
    </FieldControl>
    <div v-if="hint || showCounter || error" class="meta">
      <FieldError v-if="error" class="error" :match="true">
        {{ error }}
      </FieldError>
      <FieldDescription v-if="hint" class="hint">
        {{ hint }}
      </FieldDescription>
      <FieldDescription
        v-if="showCounter"
        as="span"
        class="counter"
        :data-state="length >= maxlength! ? 'limit' : undefined"
      >
        {{ length }}/{{ maxlength }}
      </FieldDescription>
    </div>
  </FieldRoot>
</template>

<style scoped>
.field {
  display: grid;
  gap: var(--space-2xs);
}

.label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* Reka's as-child drops the :slotted scope, so style the control as a descendant */
.field :deep(:is(input, textarea)) {
  padding: var(--space-xs) var(--space-sm);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-md);
  background: var(--color-bg-canvas);
  color: var(--color-text-primary);
  font: inherit;
}

.field :deep(textarea) {
  min-block-size: 5lh;
  resize: vertical;
}

.field :deep(:is(input, textarea)[aria-invalid='true']) {
  border-color: var(--color-danger-default);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs) var(--space-sm);
  font-size: var(--font-size-sm);
}

.error {
  flex-basis: 100%;
  color: var(--color-danger-subtle-fg);
}

.hint {
  flex: 1 1 auto;
  color: var(--color-text-muted);
}

.counter {
  margin-inline-start: auto;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.counter[data-state='limit'] {
  color: var(--color-warning-subtle-fg);
}
</style>
