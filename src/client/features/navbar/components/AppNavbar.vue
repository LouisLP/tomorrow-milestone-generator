<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import IconGithub from '~icons/lucide/github'
import BrandLogo from './BrandLogo.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import ThemeToggle from './ThemeToggle.vue'

const REPOSITORY_URL = 'https://github.com/LouisLP/tomorrow-milestone-generator'

const { t } = useI18n()
</script>

<template>
  <header class="navbar">
    <RouterLink class="brand" to="/">
      <BrandLogo />
      <span>{{ t('app.name') }}</span>
    </RouterLink>
    <div class="actions">
      <LanguageSwitcher />
      <ThemeToggle />
      <a
        class="icon-control"
        :href="REPOSITORY_URL"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t('navbar.github')"
        :title="t('navbar.github')"
      >
        <IconGithub aria-hidden="true" />
      </a>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-gutter);
  border-bottom: var(--border-width-thin) solid var(--color-border-subtle);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  min-inline-size: 0;
  color: var(--color-text-primary);
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  text-decoration: none;
}

.brand:hover {
  color: var(--color-text-primary);
}

.actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-2xs);
}

.actions :deep(.icon-control) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  min-inline-size: 2.25rem;
  block-size: 2.25rem;
  padding-inline: var(--space-xs);
  border: var(--border-width-thin) solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.actions :deep(.icon-control:hover) {
  background: var(--color-bg-surface-hover);
  color: var(--color-text-primary);
}

.actions :deep(.icon-control svg) {
  inline-size: 1.125rem;
  block-size: 1.125rem;
}

/* Narrow screens: a smaller name (it may wrap) leaves room for the controls */
@media (width < 24rem) {
  .brand {
    font-size: var(--font-size-md);
  }
}
</style>
