<script setup lang="ts">
import type { ChallengeSummary } from '@shared'
import type { ErrorCode } from '../../../api'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import IconPlus from '~icons/lucide/plus'
import { listChallenges } from '../../../api'
import { errorMessage, formatRelativeTime } from '../../../i18n'
import UniInlineAlert from '../../../ui/UniInlineAlert.vue'
import UniSpinner from '../../../ui/UniSpinner.vue'

const { t, d, locale } = useI18n()

const challenges = ref<ChallengeSummary[] | null>(null)
const error = ref<ErrorCode | null>(null)
const loading = ref(false)
// One clock per load, so every row is measured against the same "now"
const now = ref(new Date())

async function load() {
  loading.value = true
  error.value = null
  const result = await listChallenges()
  loading.value = false
  now.value = new Date()
  if (result.ok)
    challenges.value = result.data
  else
    error.value = result.error.code
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>{{ t('challenges.list.title') }}</h1>
      <RouterLink class="button-link" to="/challenges/new">
        <IconPlus aria-hidden="true" />
        {{ t('challenges.list.create') }}
      </RouterLink>
    </header>

    <UniInlineAlert
      v-if="error"
      :action-label="t('actions.retry')"
      :action-loading="loading"
      @action="load"
    >
      {{ errorMessage(error) }}
    </UniInlineAlert>

    <p v-else-if="!challenges" class="loading">
      <UniSpinner :label="t('challenges.list.loading')" />
    </p>

    <section v-else-if="challenges.length === 0" class="empty" aria-labelledby="empty-title">
      <h2 id="empty-title">
        {{ t('challenges.list.empty.title') }}
      </h2>
      <p>{{ t('challenges.list.empty.body') }}</p>
      <RouterLink class="button-link" to="/challenges/new">
        <IconPlus aria-hidden="true" />
        {{ t('challenges.list.create') }}
      </RouterLink>
    </section>

    <ul v-else class="list">
      <li v-for="challenge in challenges" :key="challenge.id" class="row">
        <RouterLink class="row-title" :to="`/challenges/${challenge.id}`">
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
    </ul>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-lg);
  max-inline-size: 48rem;
  margin-inline: auto;
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

/* A link that looks like a primary UniButton: it navigates, so it stays an <a> */
.button-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-2xs) var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--color-accent-default);
  color: var(--color-text-on-accent);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  white-space: nowrap;
  transition: background var(--duration-fast) var(--ease-out);
}

.button-link:hover {
  background: var(--color-accent-hover);
  color: var(--color-text-on-accent);
}

.button-link svg {
  inline-size: 0.875em;
  block-size: 0.875em;
}

.loading {
  display: flex;
  justify-content: center;
  padding-block: var(--space-xl);
  font-size: var(--font-size-xl);
}

.empty {
  display: grid;
  justify-items: start;
  gap: var(--space-sm);
  padding: var(--space-xl) var(--space-lg);
  border: var(--border-width-thin) dashed var(--color-border-default);
  border-radius: var(--radius-lg);
}

.empty h2 {
  font-size: var(--font-size-xl);
}

.empty p {
  color: var(--color-text-secondary);
  text-wrap: pretty;
}

.list {
  display: grid;
  gap: var(--space-xs);
  padding: 0;
  list-style: none;
}

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

.row:hover {
  background: var(--color-bg-surface-hover);
}

.row-title {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  overflow-wrap: anywhere;
}

/* Whole row is the link's hit area; the link itself keeps the focus ring */
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
