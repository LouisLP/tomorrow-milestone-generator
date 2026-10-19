<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <h1>{{ t('challenges.new.title') }}</h1>
  <p>{{ t('challenges.new.placeholder') }}</p>
</template>
