<!--
  Every confirm in the app (Reka AlertDialog). `confirm` may be async: while it runs the
  confirm button shows a spinner and the dialog can't be dismissed. It closes the dialog on
  success. To report a failure, resolve with the (translated) message, or reject and the
  dialog shows `errorFallback`; either way it stays open with the error inside. Focus goes
  back to the trigger on close; when the trigger is gone, handle `closeAutoFocus` (call
  `preventDefault()` and move focus yourself).
-->
<script setup lang="ts">
import { AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogOverlay, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle } from 'reka-ui'
import { ref, watch } from 'vue'
import UniButton from './UniButton.vue'
import UniInlineAlert from './UniInlineAlert.vue'

const props = defineProps<{
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  intent?: 'danger'
  confirm?: () => string | void | Promise<string | void>
  errorFallback?: string
}>()

const emit = defineEmits<{ closeAutoFocus: [event: Event] }>()

const open = defineModel<boolean>('open', { required: true })

const pending = ref(false)
const error = ref<string>()

watch(open, (isOpen) => {
  if (isOpen)
    error.value = undefined
})

async function onConfirm() {
  if (pending.value)
    return
  pending.value = true
  error.value = undefined
  try {
    const failure = await props.confirm?.()
    if (failure)
      error.value = failure
    else
      open.value = false
  }
  catch {
    error.value = props.errorFallback
  }
  finally {
    pending.value = false
  }
}

function blockWhilePending(event: Event) {
  if (pending.value)
    event.preventDefault()
}
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay class="overlay" />
      <AlertDialogContent
        class="content"
        @escape-key-down="blockWhilePending"
        @close-auto-focus="event => emit('closeAutoFocus', event)"
      >
        <AlertDialogTitle class="title">
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="description">
          {{ description }}
        </AlertDialogDescription>
        <UniInlineAlert v-if="error">
          {{ error }}
        </UniInlineAlert>
        <div class="actions">
          <AlertDialogCancel as-child>
            <UniButton :disabled="pending">
              {{ cancelLabel }}
            </UniButton>
          </AlertDialogCancel>
          <UniButton variant="primary" :intent="intent" :loading="pending" @click="onConfirm">
            {{ confirmLabel }}
          </UniButton>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
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

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-xs);
}
</style>
