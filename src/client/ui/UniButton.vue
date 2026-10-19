<!--
  Button with Kabuki variants. No variant = neutral. `intent="danger"` keeps a neutral or
  ghost button calm at rest and tints it on hover; on `primary` it is a solid danger button.
  `kbd` shows a shortcut hint; it's hidden from assistive tech, so pass `aria-keyshortcuts`
  to announce the shortcut.
-->
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

// Going disabled while loading drops focus to <body>; hand it back when loading ends,
// so a keyboard user can retry a failed action without hunting for the button.
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

/* A loading button is busy, not unavailable: keep it at full strength */
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
  color: var(--color-text-on-accent);
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
  background: oklch(from var(--color-danger-default) calc(l + 0.06) c h);
}

.icon {
  display: inline-flex;
}

.icon :deep(svg) {
  flex-shrink: 0;
  inline-size: 0.875em;
  block-size: 0.875em;
}

/* Follow the button's ink so the hint reads on every variant */
.button .kbd {
  margin-inline-start: var(--space-2xs);
  border-color: oklch(from currentcolor l c h / 0.4);
  color: inherit;
}
</style>
