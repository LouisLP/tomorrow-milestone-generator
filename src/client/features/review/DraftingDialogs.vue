<!--
  The two confirms a `useDraftingFlow` page needs: "Discard your edits?" before a
  Regenerate that would drop edited drafts, and "Discard drafts?" when leaving the page.
-->
<script setup lang="ts">
import type { DraftingFlow } from './useDraftingFlow'
import { useI18n } from 'vue-i18n'
import UniConfirmDialog from '../../ui/UniConfirmDialog.vue'

const props = defineProps<{ flow: DraftingFlow }>()

const { t } = useI18n()

// Props are shallow-readonly; the dialogs write through the flow's refs
const { regenerateConfirmOpen, leaveConfirmOpen } = props.flow
</script>

<template>
  <UniConfirmDialog
    v-model:open="regenerateConfirmOpen"
    intent="danger"
    :title="t('review.regenerate.confirmTitle')"
    :description="t('review.regenerate.confirmDescription')"
    :confirm-label="t('review.regenerate.label')"
    :cancel-label="t('actions.cancel')"
    :confirm="flow.confirmRegenerate"
  />
  <UniConfirmDialog
    v-model:open="leaveConfirmOpen"
    intent="danger"
    :title="t('review.leave.confirmTitle')"
    :description="t('review.leave.confirmDescription')"
    :confirm-label="t('review.leave.confirmLabel')"
    :cancel-label="t('actions.cancel')"
    :confirm="flow.confirmLeave"
  />
</template>
