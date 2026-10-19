<!--
  Inline error or warning announced on insertion (role="alert"), e.g. a failed Generate or
  Save. Render it with v-if so it's announced each time it appears.
-->
<script setup lang="ts">
import IconCircleAlert from '~icons/lucide/circle-alert'
import IconTriangleAlert from '~icons/lucide/triangle-alert'
import UniButton from './UniButton.vue'

withDefaults(defineProps<{
  tone?: 'danger' | 'warning'
  actionLabel?: string
  actionLoading?: boolean
}>(), {
  tone: 'danger',
})

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="alert" role="alert" :data-tone="tone">
    <IconTriangleAlert v-if="tone === 'warning'" class="icon" aria-hidden="true" />
    <IconCircleAlert v-else class="icon" aria-hidden="true" />
    <p class="message">
      <slot />
    </p>
    <UniButton v-if="actionLabel" :loading="actionLoading" @click="emit('action')">
      {{ actionLabel }}
    </UniButton>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs) var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border: var(--border-width-thin) solid var(--color-danger-border);
  border-radius: var(--radius-md);
  background: var(--color-danger-subtle-bg);
  color: var(--color-danger-subtle-fg);
  font-size: var(--font-size-sm);
}

.alert[data-tone='warning'] {
  border-color: var(--color-warning-default);
  background: var(--color-warning-subtle-bg);
  color: var(--color-warning-subtle-fg);
}

.icon {
  flex-shrink: 0;
  inline-size: 1em;
  block-size: 1em;
}

.message {
  flex: 1 1 20ch;
}
</style>
