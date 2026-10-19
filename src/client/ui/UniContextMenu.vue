<!-- Right-click (or Shift+F10 / the menu key) on the slotted element opens `items`. -->
<script setup lang="ts">
import type { Component } from 'vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from 'reka-ui'

export interface UniContextMenuItem {
  key: string
  label: string
  icon?: Component
  intent?: 'danger'
  select: () => void
}

defineProps<{ items: UniContextMenuItem[] }>()

defineSlots<{ default: () => unknown }>()
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent class="content" :collision-padding="8">
        <ContextMenuItem
          v-for="item in items"
          :key="item.key"
          class="item"
          :data-intent="item.intent"
          @select="item.select"
        >
          <component :is="item.icon" v-if="item.icon" class="icon" aria-hidden="true" />
          {{ item.label }}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>

<style scoped>
/* Scoped styles miss the portalled content */
:deep(.content) {
  z-index: var(--z-dropdown);
  min-inline-size: 10rem;
  padding: var(--space-2xs);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface-raised);
  box-shadow: var(--shadow-md);
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-2xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  outline: none;
}

.item[data-highlighted] {
  background: var(--color-accent-subtle-bg);
  color: var(--color-accent-subtle-fg);
}

.item[data-intent='danger'] {
  color: var(--color-danger-subtle-fg);
}

.item[data-intent='danger'][data-highlighted] {
  background: var(--color-danger-subtle-bg);
}

.icon {
  flex-shrink: 0;
  inline-size: 1em;
  block-size: 1em;
}
</style>
