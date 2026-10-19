<!-- A keyboard key, e.g. a shortcut hint. Text comes in through the slot. -->
<template>
  <kbd class="kbd"><slot /></kbd>
</template>

<style scoped>
.kbd {
  display: inline-block;
  min-inline-size: 1.5em;
  padding-inline: 0.35em;
  border: var(--border-width-thin) solid var(--color-border-default);
  border-block-end-width: var(--border-width-thick);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-code);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  text-align: center;
}
</style>
