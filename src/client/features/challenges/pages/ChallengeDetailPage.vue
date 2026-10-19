<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ id: string }>()

const { t } = useI18n()
</script>

<template>
  <h1>{{ t('challenges.detail.title') }} {{ id }}</h1>
  <p>{{ t('challenges.detail.placeholder') }}</p>
</template>
