<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'success' | 'danger' | 'warning' }>(), {
  tone: 'neutral',
})
</script>

<template>
  <span class="badge" :data-tone="tone"><slot /></span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 0 var(--space-xs);
  border-radius: var(--radius-full);
  background: var(--color-bg-surface-raised);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  white-space: nowrap;
}

.badge[data-tone='success'] {
  background: var(--color-success-subtle-bg);
  color: var(--color-success-subtle-fg);
}

.badge[data-tone='danger'] {
  background: var(--color-danger-subtle-bg);
  color: var(--color-danger-subtle-fg);
}

.badge[data-tone='warning'] {
  background: var(--color-warning-subtle-bg);
  color: var(--color-warning-subtle-fg);
}
</style>
