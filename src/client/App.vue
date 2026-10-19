<script setup lang="ts">
import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

const { t } = useI18n()
const route = useRoute()

// Re-runs on navigation and on a language switch.
watchEffect(() => {
  const appName = t('app.name')
  const { titleKey } = route.meta
  document.title = titleKey ? `${t(titleKey)} · ${appName}` : appName
})
</script>

<template>
  <a class="skip-link" href="#main">{{ t('app.skipToContent') }}</a>
  <header class="header">
    <RouterLink class="app-name" to="/">
      {{ t('app.name') }}
    </RouterLink>
    <LanguageSwitcher />
  </header>
  <main id="main" class="main" tabindex="-1">
    <RouterView />
  </main>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  z-index: var(--z-toast);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-surface-raised);
  translate: 0 calc(-100% - var(--space-md));
}

.skip-link:focus-visible {
  translate: 0 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-gutter);
  border-bottom: var(--border-width-thin) solid var(--color-border-subtle);
}

.app-name {
  color: var(--color-text-primary);
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
}

.main {
  padding: var(--space-xl) var(--space-gutter);
}

.main:focus {
  outline: none;
}
</style>
