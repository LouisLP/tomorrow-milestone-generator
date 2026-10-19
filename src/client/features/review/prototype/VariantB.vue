<!--
  PROTOTYPE (#6) Variant B, "Triage queue".
  One undecided draft at a time in a big focus card with keyboard shortcuts (A / R / E / S,
  Cmd/Ctrl+Z). Every decision is undoable from a snackbar. Editing happens in a modal (Reka
  Dialog). Decided drafts collect in a side rail. Save is the natural end of the queue.
-->
<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, ProgressIndicator, ProgressRoot } from 'reka-ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import IconCheck from '~icons/lucide/check'
import IconChevron from '~icons/lucide/chevron-down'
import IconPencil from '~icons/lucide/pencil'
import IconPlus from '~icons/lucide/plus'
import IconSkip from '~icons/lucide/skip-forward'
import IconUndo from '~icons/lucide/undo-2'
import IconX from '~icons/lucide/x'
import ConfirmDialog from './ConfirmDialog.vue'
import type { Draft, DraftState } from './useDraftReview'
import { useDraftReview } from './useDraftReview'

const { status, drafts, counts, canSave, canUndo, setState, edit, acceptAllUndecided, addStaffDraft, undo, save } = useDraftReview()

const queue = computed(() => drafts.value.filter(d => d.state === 'undecided' && !d.pending))
const currentKey = ref<string>()
const current = computed(() => queue.value.find(d => d.key === currentKey.value) ?? queue.value[0])
const accepted = computed(() => drafts.value.filter(d => d.state === 'accepted'))
const rejected = computed(() => drafts.value.filter(d => d.state === 'rejected'))
const reviewable = computed(() => drafts.value.filter(d => !d.pending && d.origin === 'ai').length)
const reviewed = computed(() => reviewable.value - queue.value.length)

const snack = ref<{ text: string, id: number }>()
let snackTimer: ReturnType<typeof setTimeout> | undefined
function flash(text: string) {
  clearTimeout(snackTimer)
  snack.value = { text, id: Date.now() }
  snackTimer = setTimeout(() => (snack.value = undefined), 5000)
}

function decide(state: DraftState) {
  const d = current.value
  if (!d)
    return
  const idx = queue.value.indexOf(d)
  setState(d.key, state)
  currentKey.value = queue.value[idx]?.key ?? queue.value[0]?.key
  flash(`${state === 'accepted' ? 'Accepted' : 'Rejected'} “${d.title}”`)
}

function skip() {
  const idx = current.value ? queue.value.indexOf(current.value) : -1
  currentKey.value = queue.value[(idx + 1) % queue.value.length]?.key
}

function doUndo() {
  if (undo()) {
    flash('Undone')
    currentKey.value = undefined
  }
}

function moveBack(d: Draft) {
  setState(d.key, 'undecided')
  currentKey.value = d.key
}

// edit modal
const editing = ref<Draft>()
const form = ref({ title: '', description: '' })
function openEdit(d: Draft | undefined) {
  if (!d)
    return
  editing.value = d
  form.value = { title: d.title, description: d.description }
}
function submitEdit(alsoAccept: boolean) {
  const d = editing.value
  if (!d)
    return
  edit(d.key, form.value)
  if (alsoAccept && d.state !== 'accepted') {
    if (current.value?.key === d.key)
      decide('accepted')
    else setState(d.key, 'accepted')
  }
  editing.value = undefined
}
function addOwn() {
  const key = addStaffDraft()
  openEdit(drafts.value.find(d => d.key === key))
}

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (editing.value || t?.closest('input, textarea, [contenteditable], [role="alertdialog"]'))
    return
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    e.preventDefault()
    doUndo()
    return
  }
  if (e.metaKey || e.ctrlKey || e.altKey || !current.value)
    return
  const k = e.key.toLowerCase()
  if (k === 'a')
    decide('accepted')
  else if (k === 'r')
    decide('rejected')
  else if (k === 's')
    skip()
  else if (k === 'e') {
    e.preventDefault()
    openEdit(current.value)
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

const confirmEarlySave = ref(false)
</script>

<template>
  <section v-if="drafts.length" class="triage" aria-labelledby="triage-h">
    <h2 id="triage-h" class="visually-hidden">
      Review drafts
    </h2>

    <div class="stage">
      <ProgressRoot :model-value="reviewed" :max="Math.max(reviewable, 1)" class="progress" :aria-label="`${reviewed} of ${reviewable} reviewed`">
        <ProgressIndicator class="progress-bar" :style="{ width: `${(reviewed / Math.max(reviewable, 1)) * 100}%` }" />
      </ProgressRoot>
      <p class="progress-label">
        {{ status === 'generating' ? 'Drafting…' : `${reviewed} of ${reviewable} reviewed` }}
      </p>

      <article v-if="status === 'generating' && !current" class="focus" aria-busy="true">
        <p class="eyebrow">
          Claude is drafting milestones from your brief
        </p>
        <div class="skeleton" style="height: 2rem; width: 60%" />
        <div class="skeleton" style="height: 1rem; width: 95%" />
        <div class="skeleton" style="height: 1rem; width: 80%" />
      </article>

      <article v-else-if="current" :key="current.key" class="focus">
        <p class="eyebrow">
          Draft {{ queue.indexOf(current) + 1 }} of {{ queue.length }} left
          <span v-if="current.edited" class="badge">Edited</span>
        </p>
        <h3 class="focus-title">
          {{ current.title }}
        </h3>
        <p class="focus-desc">
          {{ current.description }}
        </p>
        <div class="decide">
          <button class="btn btn--lg" @click="decide('rejected')">
            <IconX /> Reject <span class="kbd">R</span>
          </button>
          <button class="btn btn--lg btn--ghost" @click="openEdit(current)">
            <IconPencil /> Edit <span class="kbd">E</span>
          </button>
          <button v-if="queue.length > 1" class="btn btn--lg btn--ghost" @click="skip">
            <IconSkip /> Skip <span class="kbd">S</span>
          </button>
          <button class="btn btn--lg btn--secondary" @click="decide('accepted')">
            <IconCheck /> Accept <span class="kbd">A</span>
          </button>
        </div>
        <div class="queue-tools">
          <button class="btn btn--ghost" @click="acceptAllUndecided">
            Accept remaining {{ queue.length }}
          </button>
          <button class="btn btn--ghost" :disabled="!canSave" @click="confirmEarlySave = true">
            Save now…
          </button>
        </div>
      </article>

      <article v-else class="focus done">
        <h3 class="focus-title">
          All drafts reviewed
        </h3>
        <p class="focus-desc">
          {{ counts.accepted }} accepted, {{ counts.rejected }} rejected.
          <template v-if="!counts.accepted">
            Accept at least one, write your own, or regenerate.
          </template>
        </p>
        <div class="decide">
          <button class="btn btn--primary btn--lg" :disabled="!canSave" @click="save">
            Save {{ counts.accepted }} milestones
          </button>
        </div>
      </article>
    </div>

    <aside class="rail" aria-label="Decided drafts">
      <h3>Accepted <span class="count">{{ accepted.length }}</span></h3>
      <ol class="mini-list">
        <li v-for="d in accepted" :key="d.key" class="mini">
          <button class="mini-title" :title="d.description" @click="openEdit(d)">
            {{ d.title }}
          </button>
          <span v-if="d.origin === 'staff'" class="badge">Yours</span>
          <button v-if="d.origin === 'ai'" class="btn btn--ghost icon" aria-label="Move back to queue" @click="moveBack(d)">
            <IconUndo />
          </button>
        </li>
        <li v-if="!accepted.length" class="empty">
          Nothing yet
        </li>
      </ol>
      <button class="btn btn--ghost" :disabled="status === 'generating'" @click="addOwn">
        <IconPlus /> Add your own
      </button>

      <CollapsibleRoot v-if="rejected.length" class="rejected">
        <CollapsibleTrigger class="btn btn--ghost collapse-trigger">
          Rejected <span class="count">{{ rejected.length }}</span> <IconChevron />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ol class="mini-list">
            <li v-for="d in rejected" :key="d.key" class="mini mini--rejected">
              <s>{{ d.title }}</s>
              <button class="btn btn--ghost icon" aria-label="Move back to queue" @click="moveBack(d)">
                <IconUndo />
              </button>
            </li>
          </ol>
        </CollapsibleContent>
      </CollapsibleRoot>
    </aside>

    <div v-if="snack" :key="snack.id" class="snack" role="status">
      {{ snack.text }}
      <button v-if="canUndo" class="btn btn--ghost" @click="doUndo">
        Undo <span class="kbd">⌘Z</span>
      </button>
    </div>
  </section>

  <DialogRoot :open="!!editing" @update:open="o => !o && (editing = undefined)">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content" @open-auto-focus.prevent>
        <DialogTitle>Edit draft</DialogTitle>
        <form class="edit-form" @submit.prevent="submitEdit(false)">
          <div class="field">
            <label for="b-title">Title</label>
            <input id="b-title" v-model="form.title" class="input" maxlength="120" autofocus>
          </div>
          <div class="field">
            <label for="b-desc">Description</label>
            <textarea id="b-desc" v-model="form.description" class="input" maxlength="1000" />
          </div>
          <div class="dialog-actions">
            <DialogClose class="btn">
              Cancel
            </DialogClose>
            <button class="btn" type="submit">
              Save edit
            </button>
            <button v-if="editing?.state !== 'accepted'" class="btn btn--secondary" type="button" @click="submitEdit(true)">
              Save & accept
            </button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <ConfirmDialog
    v-model:open="confirmEarlySave"
    :title="`Save with ${queue.length} undecided?`"
    description="Undecided drafts are discarded. Only accepted drafts become milestones."
    confirm-label="Discard and save"
    @confirm="save"
  />
</template>

<style scoped>
.triage { display: grid; gap: var(--space-xl); grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (min-width: 52rem) { .triage { grid-template-columns: minmax(0, 1fr) 18rem; } }
.stage { display: grid; gap: var(--space-sm); }
.progress { height: 6px; border-radius: var(--radius-full); background: var(--color-bg-surface-raised); overflow: hidden; }
.progress-bar { height: 100%; background: var(--color-secondary-default); transition: width var(--duration-normal) var(--ease-out); }
.progress-label { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.focus {
  display: grid;
  gap: var(--space-md);
  min-height: 18rem;
  align-content: start;
  padding: var(--space-xl);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-md);
  animation: enter var(--duration-normal) var(--ease-out);
}
@keyframes enter { from { opacity: 0; translate: 0 8px; } }
.eyebrow { display: flex; gap: var(--space-xs); align-items: center; font-size: var(--font-size-sm); color: var(--color-text-muted); }
.focus-title { font-size: var(--font-size-2xl); }
.focus-desc { font-size: var(--font-size-lg); color: var(--color-text-secondary); line-height: var(--line-height-relaxed); max-width: 60ch; }
.decide { display: flex; gap: var(--space-xs); flex-wrap: wrap; margin-top: auto; }
.decide .btn--secondary { margin-inline-start: auto; }
.queue-tools { display: flex; gap: var(--space-xs); border-top: var(--border-width-thin) solid var(--color-border-subtle); padding-top: var(--space-sm); }
.done { place-content: center; text-align: center; }
.done .decide { justify-content: center; }
.badge {
  font-size: var(--font-size-xs);
  padding: 0 var(--space-xs);
  border: var(--border-width-thin) solid var(--color-secondary-border);
  border-radius: var(--radius-full);
  color: var(--color-secondary-subtle-fg);
}
.rail { display: grid; gap: var(--space-xs); position: sticky; top: var(--space-lg); }
.rail h3 { font-size: var(--font-size-md); display: flex; gap: var(--space-xs); align-items: center; }
.count { font-family: var(--font-code); font-size: var(--font-size-xs); color: var(--color-text-muted); }
.mini-list { display: grid; gap: var(--space-2xs); }
.mini {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-2xs) var(--space-xs);
  border-radius: var(--radius-md);
  background: var(--color-success-subtle-bg);
  font-size: var(--font-size-sm);
}
.mini--rejected { background: transparent; color: var(--color-text-muted); }
.mini--rejected s { flex: 1; }
.mini-title { flex: 1; text-align: start; border: 0; background: none; color: inherit; cursor: pointer; font: inherit; }
.mini-title:hover { text-decoration: underline; }
.icon { padding: var(--space-2xs); }
.empty { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.collapse-trigger { width: 100%; justify-content: flex-start; }
.snack {
  position: fixed;
  bottom: 4.5rem;
  left: 50%;
  translate: -50% 0;
  z-index: var(--z-toast);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-xs) var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-bg-inverse);
  color: var(--color-text-on-inverse);
  border: var(--border-width-thin) solid var(--color-border-on-inverse);
  box-shadow: var(--shadow-lg);
  animation: enter var(--duration-normal) var(--ease-out);
}
.snack .btn { color: var(--color-accent-on-inverse); }
.edit-form { display: grid; gap: var(--space-md); }
</style>
