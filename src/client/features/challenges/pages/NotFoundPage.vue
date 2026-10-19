<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <h1>{{ t('challenges.notFound.title') }}</h1>
  <RouterLink to="/">
    {{ t('actions.backToList') }}
  </RouterLink>
</template>
