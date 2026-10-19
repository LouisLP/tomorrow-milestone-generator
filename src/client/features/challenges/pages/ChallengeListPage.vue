<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <h1>{{ t('challenges.list.title') }}</h1>
  <p>{{ t('challenges.list.placeholder') }}</p>
  <RouterLink to="/challenges/new">
    {{ t('challenges.list.create') }}
  </RouterLink>
</template>
