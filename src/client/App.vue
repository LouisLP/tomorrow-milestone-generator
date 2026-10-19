<script setup lang="ts">
import { nextTick, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppNavbar from './features/navbar/components/AppNavbar.vue'
import { focusPageHeading } from './utils/focus.utils'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

watchEffect(() => {
  const appName = t('app.name')
  const { titleKey } = route.meta
  document.title = titleKey ? `${t(titleKey)} · ${appName}` : appName
})

router.afterEach(async (_to, from, failure) => {
  // The first load keeps the browser's own focus
  if (failure || from.matched.length === 0)
    return
  await nextTick()
  focusPageHeading()
})
</script>

<template>
  <a class="skip-link" href="#main">{{ t('app.skipToContent') }}</a>
  <AppNavbar />
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

.main {
  padding: var(--space-xl) var(--space-gutter);
}

.main:focus {
  outline: none;
}
</style>
