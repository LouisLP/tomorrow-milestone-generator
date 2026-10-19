<!-- `kbd` is hidden from assistive tech: pair it with `aria-keyshortcuts`. -->
<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'
import UniKbd from './UniKbd.vue'
import UniSpinner from './UniSpinner.vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'lg'
  intent?: 'danger'
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
  kbd?: string
}>(), {
  size: 'md',
  type: 'button',
})

defineSlots<{
  default: () => unknown
  icon?: () => unknown
}>()

// Disabling while loading drops focus to <body>; hand it back afterwards
const button = useTemplateRef('button')
let hadFocus = false
watch(() => props.loading, async (loading) => {
  if (loading) {
    hadFocus = document.activeElement === button.value
    return
  }
  if (hadFocus) {
    hadFocus = false
    await nextTick()
    button.value?.focus()
  }
})
</script>

<template>
  <button
    ref="button"
    class="button"
    :type="type"
    :data-variant="variant"
    :data-size="size"
    :data-intent="intent"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <UniSpinner v-if="loading" />
    <span v-else-if="$slots.icon" class="icon" aria-hidden="true"><slot name="icon" /></span>
    <slot />
    <UniKbd v-if="kbd" class="kbd" aria-hidden="true">
      {{ kbd }}
    </UniKbd>
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  min-inline-size: fit-content;
  padding: var(--space-2xs) var(--space-sm);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface-raised);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition:
    background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.button:hover:not(:disabled) {
  background: var(--color-bg-surface-hover);
}

.button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Busy, not unavailable */
.button[aria-busy='true'] {
  opacity: 1;
  cursor: progress;
}

.button[data-size='lg'] {
  padding: var(--space-xs) var(--space-md);
  font-size: var(--font-size-md);
}

.button[data-variant='primary'] {
  border-color: transparent;
  background: var(--color-accent-default);
  color: var(--color-text-on-accent);
}

.button[data-variant='primary']:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.button[data-variant='secondary'] {
  border-color: transparent;
  background: var(--color-secondary-default);
  color: var(--color-text-on-secondary);
}

.button[data-variant='secondary']:hover:not(:disabled) {
  background: var(--color-secondary-hover);
}

.button[data-variant='ghost'] {
  border-color: transparent;
  background: transparent;
  color: var(--color-text-secondary);
}

.button[data-variant='ghost']:hover:not(:disabled) {
  background: var(--color-bg-surface-hover);
  color: var(--color-text-primary);
}

.button[data-intent='danger']:not([data-variant='primary']):hover:not(:disabled) {
  border-color: var(--color-danger-border);
  background: var(--color-danger-subtle-bg);
  color: var(--color-danger-subtle-fg);
}

.button[data-variant='primary'][data-intent='danger'] {
  background: var(--color-danger-default);
  color: var(--color-text-on-danger);
}

.button[data-variant='primary'][data-intent='danger']:hover:not(:disabled) {
  background: var(--color-danger-hover);
}

.icon {
  display: inline-flex;
}

.icon :deep(svg) {
  flex-shrink: 0;
  inline-size: 0.875em;
  block-size: 0.875em;
}

.button .kbd {
  margin-inline-start: var(--space-2xs);
  border-color: oklch(from currentcolor l c h / 0.4);
  color: inherit;
}
</style>
