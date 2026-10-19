<script setup lang="ts">
import type { ChallengeSummary } from '@shared'
import type { UniContextMenuItem } from '../../../ui/UniContextMenu.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import IconPencil from '~icons/lucide/pencil'
import IconTrash from '~icons/lucide/trash-2'
import { formatRelativeTime } from '../../../i18n'
import UniContextMenu from '../../../ui/UniContextMenu.vue'

const props = defineProps<{
  challenge: ChallengeSummary
  /** One clock for the whole list */
  now: Date
}>()

const emit = defineEmits<{ delete: [] }>()

const { t, d, locale } = useI18n()
const router = useRouter()

const to = computed(() => ({ name: 'challenge-detail', params: { id: props.challenge.id } }))

const menuItems = computed<UniContextMenuItem[]>(() => [
  { key: 'edit', label: t('actions.edit'), icon: IconPencil, select: () => router.push(to.value) },
  { key: 'delete', label: t('actions.delete'), icon: IconTrash, intent: 'danger', select: () => emit('delete') },
])
</script>

<template>
  <UniContextMenu :items="menuItems">
    <li class="row">
      <RouterLink class="row-title" :to="to" :data-challenge-id="challenge.id">
        {{ challenge.title }}
      </RouterLink>
      <p class="row-meta">
        <span>{{ t('challenges.list.milestoneCount', challenge.milestoneCount) }}</span>
        <span aria-hidden="true">·</span>
        <time :datetime="challenge.updatedAt" :title="d(challenge.updatedAt, 'dateTime')">
          {{ t('challenges.list.updated', { time: formatRelativeTime(challenge.updatedAt, locale, now) }) }}
        </time>
      </p>
    </li>
  </UniContextMenu>
</template>

<style scoped>
.row {
  position: relative;
  display: grid;
  gap: var(--space-2xs);
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width-thin) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  transition: background var(--duration-fast) var(--ease-out);
}

.row:hover,
.row[data-state='open'] {
  background: var(--color-bg-surface-raised);
}

.row-title {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.row-title:hover {
  color: var(--color-text-primary);
}

/* The whole row is the link's hit area */
.row-title::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
