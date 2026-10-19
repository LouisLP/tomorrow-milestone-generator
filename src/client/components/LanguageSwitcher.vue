<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectViewport,
} from 'reka-ui'
import { useI18n } from 'vue-i18n'
import IconCheck from '~icons/lucide/check'
import IconLanguages from '~icons/lucide/languages'
import { isLocale, LOCALES, setLocale } from '../i18n'

const { t, locale } = useI18n()

function onSelect(value: AcceptableValue) {
  if (isLocale(value))
    setLocale(value)
}
</script>

<template>
  <SelectRoot :model-value="locale" @update:model-value="onSelect">
    <SelectTrigger class="trigger" :aria-label="t('language.label')">
      <IconLanguages aria-hidden="true" />
      <span>{{ locale.toUpperCase() }}</span>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="content" position="popper" align="end" :side-offset="4">
        <SelectViewport>
          <SelectItem
            v-for="(name, code) in LOCALES"
            :key="code"
            class="item"
            :value="code"
            :lang="code"
          >
            <SelectItemText>{{ name }}</SelectItemText>
            <SelectItemIndicator class="indicator">
              <IconCheck aria-hidden="true" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style scoped>
.trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.trigger:hover {
  background-color: var(--color-bg-surface-hover);
}

/* Reka puts the scope attribute on its popper wrapper, not on the content itself */
:deep(.content) {
  min-width: 10rem;
  padding: var(--space-xs);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-surface-raised);
  box-shadow: var(--shadow-md);
  z-index: var(--z-dropdown);
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
  outline: none;
}

.item[data-highlighted] {
  background-color: var(--color-accent-subtle-bg);
  color: var(--color-accent-subtle-fg);
}

.indicator {
  display: inline-flex;
}
</style>
