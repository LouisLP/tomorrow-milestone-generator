<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import IconMoon from '~icons/lucide/moon'
import IconSun from '~icons/lucide/sun'
import { useTheme } from '../composables/useTheme'

const { t } = useI18n()
const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    class="icon-control"
    :aria-label="theme === 'dark' ? t('navbar.theme.toLight') : t('navbar.theme.toDark')"
    :title="theme === 'dark' ? t('navbar.theme.toLight') : t('navbar.theme.toDark')"
    @click="toggleTheme"
  >
    <IconSun v-if="theme === 'dark'" aria-hidden="true" />
    <IconMoon v-else aria-hidden="true" />
  </button>
</template>
