<!-- PROTOTYPE (#6): floating variant switcher + live state panel. Never ships. -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import IconLeft from '~icons/lucide/chevron-left'
import IconRight from '~icons/lucide/chevron-right'
import { useDraftReview } from './useDraftReview'

const props = defineProps<{ variants: Array<{ key: string, name: string }> }>()
const current = defineModel<string>({ required: true })
const { status, drafts, counts, lastAction, canUndo } = useDraftReview()

const index = computed(() => Math.max(0, props.variants.findIndex(v => v.key === current.value)))
const label = computed(() => props.variants[index.value]!)

function go(step: number) {
  const n = props.variants.length
  current.value = props.variants[(index.value + step + n) % n]!.key
}

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (t?.closest('input, textarea, [contenteditable], [role="dialog"], [role="alertdialog"]'))
    return
  if (e.key === 'ArrowLeft')
    go(-1)
  if (e.key === 'ArrowRight')
    go(1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

const state = computed(() => ({
  status: status.value,
  counts: counts.value,
  canUndo: canUndo.value,
  lastAction: lastAction.value,
  drafts: drafts.value.map(d => `${d.pending ? '⏳' : { undecided: '·', accepted: '✓', rejected: '✗' }[d.state]} ${d.origin === 'staff' ? '[staff] ' : ''}${d.edited ? '[edited] ' : ''}${d.title || '(loading)'}`),
}))
</script>

<template>
  <div class="switcher" role="toolbar" aria-label="Prototype variant switcher">
    <button class="arrow" aria-label="Previous variant" @click="go(-1)">
      <IconLeft />
    </button>
    <span class="label"><strong>{{ label.key }}</strong> {{ label.name }}</span>
    <button class="arrow" aria-label="Next variant" @click="go(1)">
      <IconRight />
    </button>
  </div>
  <details class="state">
    <summary>state</summary>
    <pre>{{ JSON.stringify(state, null, 2) }}</pre>
  </details>
</template>

<style scoped>
.switcher {
  position: fixed;
  bottom: var(--space-md);
  left: 50%;
  translate: -50% 0;
  z-index: var(--z-toast);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-2xs);
  border-radius: var(--radius-full);
  background: #fff;
  color: #000;
  box-shadow: 0 6px 24px rgb(0 0 0 / 0.5);
  font-family: var(--font-code);
  font-size: var(--font-size-sm);
}
.arrow {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: var(--radius-full);
  background: #000;
  color: #fff;
  cursor: pointer;
}
.label { padding-inline: var(--space-xs); white-space: nowrap; }
.state {
  position: fixed;
  right: var(--space-md);
  bottom: var(--space-md);
  z-index: var(--z-toast);
  max-width: min(26rem, 90vw);
  max-height: 60vh;
  overflow: auto;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  background: #fff;
  color: #000;
  font-family: var(--font-code);
  font-size: var(--font-size-xs);
  box-shadow: 0 6px 24px rgb(0 0 0 / 0.5);
}
.state summary { cursor: pointer; }
.state pre { white-space: pre-wrap; font-size: inherit; }
</style>
