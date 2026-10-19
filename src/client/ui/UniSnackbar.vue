<!--
  One transient message at a time (role="status"), e.g. "Accepted '…'" with Undo. Setting a
  new notice replaces the current one and restarts the timer; give each notice a fresh `id`
  so repeating the same message still counts as new. The timer pauses while the pointer or
  focus is on the snackbar. The live region stays mounted so every message is announced.
-->
<script lang="ts">
</script>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import UniButton from './UniButton.vue'

export interface SnackbarNotice {
  id: string | number
  message: string
  actionLabel?: string
}

const props = withDefaults(defineProps<{ duration?: number }>(), {
  duration: 5000,
})

const emit = defineEmits<{ action: [notice: SnackbarNotice] }>()

const notice = defineModel<SnackbarNotice | undefined>('notice')

let timer: ReturnType<typeof setTimeout> | undefined
const paused = ref(false)

function clear() {
  clearTimeout(timer)
  timer = undefined
}

function start() {
  clear()
  if (notice.value && !paused.value)
    timer = setTimeout(dismiss, props.duration)
}

function dismiss() {
  clear()
  // The element goes away, so no pointerleave/focusout will come to unpause it
  paused.value = false
  notice.value = undefined
}

function pause() {
  paused.value = true
  clear()
}

function resume() {
  paused.value = false
  start()
}

function onAction() {
  if (!notice.value)
    return
  emit('action', notice.value)
  dismiss()
}

watch(() => notice.value?.id, start, { immediate: true })
onUnmounted(clear)
</script>

<template>
  <div class="region" role="status">
    <div
      v-if="notice"
      :key="notice.id"
      class="snackbar"
      @pointerenter="pause"
      @pointerleave="resume"
      @focusin="pause"
      @focusout="resume"
    >
      <p class="message">
        {{ notice.message }}
      </p>
      <UniButton v-if="notice.actionLabel" variant="ghost" class="action" @click="onAction">
        {{ notice.actionLabel }}
      </UniButton>
    </div>
  </div>
</template>

<style scoped>
.region {
  position: fixed;
  inset-block-end: var(--space-lg);
  inset-inline: var(--space-gutter);
  z-index: var(--z-toast);
  display: grid;
  justify-items: center;
  pointer-events: none;
}

.snackbar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  max-inline-size: 40rem;
  padding: var(--space-xs) var(--space-xs) var(--space-xs) var(--space-md);
  border: var(--border-width-thin) solid var(--color-border-on-inverse);
  border-radius: var(--radius-md);
  background: var(--color-bg-inverse);
  box-shadow: var(--shadow-lg);
  color: var(--color-text-on-inverse);
  font-size: var(--font-size-sm);
  pointer-events: auto;
}

@media (prefers-reduced-motion: no-preference) {
  .snackbar {
    animation: rise var(--duration-normal) var(--ease-out);
  }
}

.message {
  flex: 1;
}

.snackbar .action,
.snackbar .action:hover:not(:disabled) {
  color: var(--color-accent-on-inverse);
}

.snackbar .action:hover:not(:disabled) {
  background: oklch(from var(--color-text-on-inverse) l c h / 0.12);
}

@keyframes rise {
  from {
    opacity: 0;
    translate: 0 var(--space-sm);
  }
}
</style>
