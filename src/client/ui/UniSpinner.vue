<!--
  Busy indicator. Decorative by default (the busy control carries aria-busy); pass `label`
  when the spinner stands alone and has to be announced.
-->
<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <span
    class="spinner"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  />
</template>

<style scoped>
.spinner {
  display: inline-block;
  flex-shrink: 0;
  inline-size: 1em;
  block-size: 1em;
  border: 0.15em solid oklch(from currentcolor l c h / 0.25);
  border-block-start-color: currentcolor;
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

/* No rotation for reduced motion: a slow pulse still says "busy" */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: pulse var(--duration-ambient) var(--ease-in-out) infinite;
  }
}

@keyframes spin {
  to {
    rotate: 1turn;
  }
}

@keyframes pulse {
  50% {
    opacity: 0.4;
  }
}
</style>
