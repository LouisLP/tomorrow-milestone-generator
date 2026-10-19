<!--
  PROTOTYPE (#6) Variant B, "Triage queue".
  One undecided draft at a time in a big focus card with keyboard shortcuts (A / R / E / S,
  Cmd/Ctrl+Z). Every decision is undoable from a snackbar. Only two fields, so editing is
  inline (Reka Editable): click the text, or press E. Accepted drafts in the side rail expand
  to edit in place. Save is the natural end of the queue.
-->
<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger, EditableArea, EditableInput, EditablePreview, EditableRoot, ProgressIndicator, ProgressRoot } from 'reka-ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import IconCheck from '~icons/lucide/check'
import IconChevron from '~icons/lucide/chevron-down'
import IconChevronUp from '~icons/lucide/chevron-up'
import IconPencil from '~icons/lucide/pencil'
import IconPlus from '~icons/lucide/plus'
import IconSkip from '~icons/lucide/skip-forward'
import IconTrash from '~icons/lucide/trash-2'
import IconUndo from '~icons/lucide/undo-2'
import IconX from '~icons/lucide/x'
import ConfirmDialog from './ConfirmDialog.vue'
import type { Draft, DraftState } from './useDraftReview'
import { useDraftReview } from './useDraftReview'

const { status, drafts, counts, canSave, canUndo, setState, edit, acceptAllUndecided, addStaffDraft, removeDraft, undo, save } = useDraftReview()

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

// inline editing: E opens the focus card's title; rail items expand to edit in place
const focusTitle = ref<InstanceType<typeof EditableRoot>>()
const expandedKey = ref<string>()
const freshKey = ref<string>()
function startEdit() {
  focusTitle.value?.edit()
}
function toggleExpanded(d: Draft) {
  expandedKey.value = expandedKey.value === d.key ? undefined : d.key
}
function addOwn() {
  const key = addStaffDraft()
  freshKey.value = key
  expandedKey.value = key
}

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (t?.closest('input, textarea, [contenteditable], [role="alertdialog"]'))
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
    startEdit()
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
        <EditableRoot
          ref="focusTitle"
          :model-value="current.title"
          submit-mode="both"
          select-on-focus
          @submit="v => edit(current!.key, { title: v ?? '' })"
        >
          <EditableArea>
            <EditablePreview as="h3" class="focus-title editable" title="Click to edit" />
            <EditableInput class="input focus-title-input" maxlength="120" />
          </EditableArea>
        </EditableRoot>
        <EditableRoot
          :model-value="current.description"
          submit-mode="blur"
          @submit="v => edit(current!.key, { description: v ?? '' })"
        >
          <EditableArea>
            <EditablePreview as="p" class="focus-desc editable" title="Click to edit" />
            <EditableInput as="textarea" class="input focus-desc-input" rows="3" maxlength="1000" />
          </EditableArea>
        </EditableRoot>
        <div class="decide">
          <button class="btn btn--lg" @click="decide('rejected')">
            <IconX /> Reject <span class="kbd">R</span>
          </button>
          <button class="btn btn--lg btn--ghost" @click="startEdit">
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
        <li v-for="d in accepted" :key="d.key" class="mini" :class="{ 'mini--open': expandedKey === d.key }">
          <div class="mini-head">
            <button v-if="expandedKey !== d.key" class="mini-title" :aria-expanded="false" @click="toggleExpanded(d)">
              {{ d.title }}
            </button>
            <EditableRoot
              v-else
              class="mini-title-edit"
              :model-value="d.title"
              submit-mode="both"
              :start-with-edit-mode="d.key === freshKey"
              select-on-focus
              @submit="v => edit(d.key, { title: v ?? '' })"
            >
              <EditableArea>
                <EditablePreview class="mini-edit-title editable" title="Click to edit" />
                <EditableInput class="input" maxlength="120" />
              </EditableArea>
            </EditableRoot>
            <span v-if="d.origin === 'staff'" class="badge">Yours</span>
            <button v-if="expandedKey === d.key" class="btn btn--ghost icon" aria-label="Collapse" @click="expandedKey = undefined">
              <IconChevronUp />
            </button>
            <button v-else-if="d.origin === 'ai'" class="btn btn--ghost icon" aria-label="Move back to queue" @click="moveBack(d)">
              <IconUndo />
            </button>
          </div>
          <div v-if="expandedKey === d.key" class="mini-edit">
            <EditableRoot
              :model-value="d.description"
              submit-mode="blur"
              @submit="v => edit(d.key, { description: v ?? '' })"
            >
              <EditableArea>
                <EditablePreview class="mini-edit-desc editable" title="Click to edit" />
                <EditableInput as="textarea" class="input" rows="4" maxlength="1000" />
              </EditableArea>
            </EditableRoot>
            <div class="mini-actions">
              <button v-if="d.origin === 'ai'" class="btn btn--ghost" @click="moveBack(d)">
                <IconUndo /> Back to queue
              </button>
              <button v-else class="btn btn--ghost" @click="removeDraft(d.key)">
                <IconTrash /> Remove
              </button>
            </div>
          </div>
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
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-2xs) var(--space-xs);
  border-radius: var(--radius-md);
  background: var(--color-success-subtle-bg);
  font-size: var(--font-size-sm);
}
.mini-head { display: flex; align-items: center; gap: var(--space-2xs); }
.mini--open { padding: var(--space-xs); outline: var(--border-width-thin) solid var(--color-secondary-border); }
.mini-edit { display: grid; gap: var(--space-xs); }
.mini-title-edit { flex: 1; min-width: 0; }
.mini-edit-title { font-weight: var(--font-weight-semibold); }
.mini-edit-desc { color: var(--color-text-secondary); display: block; }
.mini-actions { display: flex; justify-content: flex-end; }
.mini--rejected { display: flex; align-items: center; gap: var(--space-2xs); background: transparent; color: var(--color-text-muted); }
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
.editable { cursor: text; border-radius: var(--radius-sm); }
.editable:hover { background: var(--color-bg-surface-hover); box-shadow: 0 0 0 var(--space-2xs) var(--color-bg-surface-hover); }
.focus-title-input { font-family: var(--font-heading); font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); }
.focus-desc-input { font-size: var(--font-size-lg); line-height: var(--line-height-relaxed); }
</style>
