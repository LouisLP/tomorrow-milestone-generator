<!--
  PROTOTYPE (#6): three review-step variants inside a mock New Challenge page,
  switchable via ?variant=A|B|C and the floating bar. Host form + Save result are shared;
  each variant owns the review layout, editing, undo, bulk accept and Save behaviour.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IconChevronUp from '~icons/lucide/chevron-up'
import IconPencil from '~icons/lucide/pencil'
import IconSparkles from '~icons/lucide/sparkles'
import IconRefresh from '~icons/lucide/refresh-cw'
import IconCheck from '~icons/lucide/circle-check'
import ConfirmDialog from './ConfirmDialog.vue'
import PrototypeSwitcher from './PrototypeSwitcher.vue'
import { useDraftReview } from './useDraftReview'
import VariantA from './VariantA.vue'
import VariantB from './VariantB.vue'
import VariantC from './VariantC.vue'
import './prototype.css'

const variants = [
  { key: 'A', name: 'Inline card list' },
  { key: 'B', name: 'Triage queue' },
  { key: 'C', name: 'Two-column sort' },
]
const variant = ref(new URLSearchParams(location.search).get('variant')?.toUpperCase() ?? 'A')
watch(variant, (v) => {
  const url = new URL(location.href)
  url.searchParams.set('variant', v)
  history.replaceState(null, '', url)
})

const { title, brief, status, drafts, saved, regenerateDiscardsEdits, generate, reset } = useDraftReview()
const confirmRegenerate = ref(false)
const reviewing = computed(() => drafts.value.length > 0)
const detailsOpen = ref(false)
// ?autogen skips straight to the review step
if (new URLSearchParams(location.search).has('autogen'))
  generate()

function onGenerate() {
  if (regenerateDiscardsEdits.value)
    confirmRegenerate.value = true
  else
    generate()
}
</script>

<template>
  <header class="app-header">
    <span class="brand">Milestone Generator</span>
    <span class="tag">PROTOTYPE #6</span>
  </header>

  <main class="page">
    <nav class="crumbs" aria-label="Breadcrumb">
      Challenges / <span>New challenge</span>
    </nav>
    <h1 :class="{ compact: reviewing }">
      New challenge
    </h1>

    <template v-if="status !== 'saved'">
      <!-- once drafts exist, details shrink to a one-line strip so the review owns the page -->
      <section v-if="reviewing && !detailsOpen" class="strip" aria-label="Challenge details">
        <div class="strip-text">
          <strong>{{ title }}</strong>
          <span>{{ brief }}</span>
        </div>
        <button class="btn" data-variant="ghost" @click="detailsOpen = true">
          <IconPencil /> Edit details
        </button>
        <button class="btn" :disabled="status === 'generating'" @click="onGenerate">
          <IconRefresh :class="{ spin: status === 'generating' }" />
          {{ status === 'generating' ? 'Drafting…' : 'Regenerate' }}
        </button>
      </section>

      <section v-else class="form" aria-labelledby="details-h">
        <h2 id="details-h" class="visually-hidden">
          Challenge details
        </h2>
        <div class="field">
          <label for="title">Title</label>
          <input id="title" v-model="title" class="input" maxlength="120">
        </div>
        <div class="field">
          <label for="brief">Brief</label>
          <textarea id="brief" v-model="brief" class="input" maxlength="4000" />
        </div>
        <div class="form-actions">
          <button class="btn" data-size="lg" :data-variant="drafts.length ? undefined : 'primary'" :disabled="status === 'generating' || !title.trim() || !brief.trim()" @click="onGenerate">
            <component :is="drafts.length ? IconRefresh : IconSparkles" :class="{ spin: status === 'generating' }" />
            {{ status === 'generating' ? 'Drafting milestones…' : drafts.length ? 'Regenerate' : 'Generate milestones' }}
          </button>
          <span v-if="drafts.length && status !== 'generating'" class="hint">Regenerate keeps accepted drafts and replaces the rest.</span>
          <button v-if="reviewing" class="btn" data-variant="ghost" @click="detailsOpen = false">
            <IconChevronUp /> Done
          </button>
        </div>
      </section>

      <VariantA v-if="variant === 'A'" />
      <VariantB v-else-if="variant === 'B'" />
      <VariantC v-else />
    </template>

    <section v-else class="saved" aria-labelledby="saved-h">
      <h2 id="saved-h">
        <IconCheck /> Saved “{{ title }}”
      </h2>
      <p>Mock detail page. {{ saved.length }} milestones persisted, in this order:</p>
      <ol>
        <li v-for="m in saved" :key="m.title">
          <strong>{{ m.title }}</strong> — {{ m.description }}
        </li>
      </ol>
      <button class="btn" @click="reset">
        Start over
      </button>
    </section>
  </main>

  <ConfirmDialog
    v-model:open="confirmRegenerate"
    title="Discard your edits?"
    description="Regenerating replaces undecided and rejected drafts, including ones you edited. Accepted drafts are kept."
    confirm-label="Regenerate"
    @confirm="generate"
  />

  <PrototypeSwitcher v-model="variant" :variants="variants" />
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-gutter);
  border-bottom: var(--border-width-thin) solid var(--color-border-subtle);
}
.brand { font-family: var(--font-heading); font-weight: var(--font-weight-bold); font-size: var(--font-size-lg); }
.tag { font-family: var(--font-code); font-size: var(--font-size-xs); color: var(--color-accent-subtle-fg); }
.page {
  max-width: 64rem;
  margin-inline: auto;
  padding: var(--space-xl) var(--space-gutter) var(--space-4xl);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-lg);
}
.crumbs { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.crumbs span { color: var(--color-text-secondary); }
h1 { font-size: var(--font-size-3xl); transition: font-size var(--duration-normal) var(--ease-out); }
h1.compact { font-size: var(--font-size-xl); }
.strip {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-xs) var(--space-xs) var(--space-md);
  border: var(--border-width-thin) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  flex-wrap: wrap;
}
.strip-text { flex: 1 1 16rem; min-width: 0; display: flex; gap: var(--space-sm); align-items: baseline; }
.strip-text strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; max-width: 100%; }
.strip-text span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--font-size-sm); color: var(--color-text-muted); }
.form { display: grid; gap: var(--space-md); max-width: 44rem; }
.form-actions { display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap; }
.hint { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { rotate: 360deg; } }
.saved { display: grid; gap: var(--space-md); }
.saved h2 { font-size: var(--font-size-2xl); display: flex; align-items: center; gap: var(--space-xs); color: var(--color-success-subtle-fg); }
.saved ol { display: grid; gap: var(--space-xs); padding-inline-start: var(--space-lg); list-style: decimal; }
.saved li { color: var(--color-text-secondary); }
.saved li strong { color: var(--color-text-primary); }
</style>
