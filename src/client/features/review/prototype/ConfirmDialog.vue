<!-- PROTOTYPE (#6): Reka AlertDialog wrapper used for every confirm (#4). -->
<script setup lang="ts">
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogOverlay, AlertDialogPortal, AlertDialogRoot, AlertDialogTitle } from 'reka-ui'

defineProps<{ title: string, description: string, confirmLabel: string, altLabel?: string }>()
const emit = defineEmits<{ confirm: [], alt: [] }>()
const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay class="dialog-overlay" />
      <AlertDialogContent class="dialog-content">
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ description }}</AlertDialogDescription>
        <div class="dialog-actions">
          <AlertDialogCancel class="btn">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction v-if="altLabel" class="btn btn--secondary" @click="emit('alt')">
            {{ altLabel }}
          </AlertDialogAction>
          <AlertDialogAction class="btn btn--primary" @click="emit('confirm')">
            {{ confirmLabel }}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
