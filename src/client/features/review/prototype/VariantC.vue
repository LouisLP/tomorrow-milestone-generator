<!--
  PROTOTYPE (#6) Variant C, "Two-column sort".
  Left: AI drafts waiting for a decision. Right: the challenge as it will be saved (WYSIWYG).
  Accepting moves a draft right; rejecting drops it into a tray under the left column.
  Editing opens a side drawer (Reka Dialog). Save saves the right column, no confirm:
  whatever is still on the left simply isn't part of the challenge.
-->
<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { computed, ref } from 'vue'
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconArrowRight from '~icons/lucide/arrow-right'
import IconPencil from '~icons/lucide/pencil'
import IconPlus from '~icons/lucide/plus'
import IconTrash from '~icons/lucide/trash-2'
import IconX from '~icons/lucide/x'
import type { Draft } from './useDraftReview'
import { CAP, useDraftReview } from './useDraftReview'

const { status, drafts, counts, canSave, setState, edit, acceptAllUndecided, addStaffDraft, removeDraft, save } = useDraftReview()

const left = computed(() => drafts.value.filter(d => d.state === 'undecided'))
const right = computed(() => drafts.value.filter(d => d.state === 'accepted'))
const tray = computed(() => drafts.value.filter(d => d.state === 'rejected'))

const editing = ref<Draft>()
const form = ref({ title: '', description: '' })
function openEdit(d: Draft) {
  editing.value = d
  form.value = { title: d.title, description: d.description }
}
function submitEdit() {
  if (editing.value)
    edit(editing.value.key, form.value)
  editing.value = undefined
}
function addOwn() {
  const key = addStaffDraft()
  const d = drafts.value.find(x => x.key === key)
  if (d)
    openEdit(d)
}
</script>

<template>
  <section v-if="drafts.length" class="board" aria-label="Review drafts">
    <div class="col col--drafts">
      <header class="col-head">
        <h2>AI drafts</h2>
        <span class="count">{{ counts.undecided }}</span>
        <button class="btn btn--ghost" :disabled="!counts.undecided" @click="acceptAllUndecided">
          Accept all <IconArrowRight />
        </button>
      </header>

      <ul class="rows">
        <li v-for="d in left" :key="d.key" class="row" :aria-busy="d.pending">
          <template v-if="d.pending">
            <div class="row-text">
              <div class="skeleton" style="height: 1rem; width: 60%" />
              <div class="skeleton" style="height: 0.8rem; width: 90%; margin-top: 0.4rem" />
            </div>
          </template>
          <template v-else>
            <div class="row-text">
              <strong>{{ d.title }}</strong>
              <span v-if="d.edited" class="badge">Edited</span>
              <p>{{ d.description }}</p>
            </div>
            <div class="row-actions">
              <button class="btn btn--ghost icon" aria-label="Reject" title="Reject" @click="setState(d.key, 'rejected')">
                <IconX />
              </button>
              <button class="btn btn--ghost icon" aria-label="Edit" title="Edit" @click="openEdit(d)">
                <IconPencil />
              </button>
              <button class="btn btn--secondary" @click="setState(d.key, 'accepted')">
                Accept <IconArrowRight />
              </button>
            </div>
          </template>
        </li>
        <li v-if="!left.length" class="empty">
          No drafts waiting. Regenerate for more ideas.
        </li>
      </ul>

      <div v-if="tray.length" class="tray">
        <span class="tray-label">Rejected</span>
        <button v-for="d in tray" :key="d.key" class="chip" :title="`Restore “${d.title}”`" @click="setState(d.key, 'undecided')">
          <s>{{ d.title }}</s> <IconArrowLeft />
        </button>
      </div>
    </div>

    <div class="col col--challenge">
      <header class="col-head">
        <h2>Your challenge</h2>
        <span class="count">{{ counts.accepted }} / {{ CAP }}</span>
      </header>

      <ol class="milestones">
        <li v-for="(d, i) in right" :key="d.key" class="milestone">
          <span class="step">{{ i + 1 }}</span>
          <div class="milestone-text">
            <strong>{{ d.title }}</strong>
            <span v-if="d.origin === 'staff'" class="badge">Yours</span>
            <span v-else-if="d.edited" class="badge">Edited</span>
            <p>{{ d.description }}</p>
          </div>
          <div class="row-actions">
            <button class="btn btn--ghost icon" aria-label="Edit" title="Edit" @click="openEdit(d)">
              <IconPencil />
            </button>
            <button v-if="d.origin === 'ai'" class="btn btn--ghost icon" aria-label="Back to drafts" title="Back to drafts" @click="setState(d.key, 'undecided')">
              <IconArrowLeft />
            </button>
            <button v-else class="btn btn--ghost icon" aria-label="Remove" title="Remove" @click="removeDraft(d.key)">
              <IconTrash />
            </button>
          </div>
        </li>
        <li v-if="!right.length" class="empty drop">
          Accept drafts to build the challenge here.
        </li>
      </ol>

      <button class="btn btn--ghost add" :disabled="status === 'generating'" @click="addOwn">
        <IconPlus /> Add milestone
      </button>

      <footer class="col-foot">
        <button class="btn btn--primary btn--lg" :disabled="!canSave" @click="save">
          Save challenge
        </button>
        <p v-if="counts.undecided" class="note">
          {{ counts.undecided }} drafts on the left won't be saved.
        </p>
      </footer>
    </div>
  </section>

  <DialogRoot :open="!!editing" @update:open="o => !o && (editing = undefined)">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="drawer">
        <DialogTitle>Edit milestone</DialogTitle>
        <DialogDescription class="drawer-sub">
          {{ editing?.state === 'accepted' ? 'In your challenge' : 'Still a draft. Editing does not accept it.' }}
        </DialogDescription>
        <form class="edit-form" @submit.prevent="submitEdit">
          <div class="field">
            <label for="c-title">Title</label>
            <input id="c-title" v-model="form.title" class="input" maxlength="120">
            <small>{{ form.title.length }} / 120</small>
          </div>
          <div class="field">
            <label for="c-desc">Description</label>
            <textarea id="c-desc" v-model="form.description" class="input" rows="8" maxlength="1000" />
            <small>{{ form.description.length }} / 1000</small>
          </div>
          <div class="dialog-actions">
            <DialogClose class="btn">
              Cancel
            </DialogClose>
            <button class="btn btn--primary" type="submit">
              Save
            </button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.board { display: grid; gap: var(--space-lg); grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (min-width: 56rem) { .board { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
.col { display: grid; gap: var(--space-sm); padding: var(--space-md); border-radius: var(--radius-lg); }
.col--drafts { background: var(--color-bg-surface); border: var(--border-width-thin) dashed var(--color-border-default); }
.col--challenge { background: var(--color-bg-surface-raised); border: var(--border-width-thin) solid var(--color-border-default); box-shadow: var(--shadow-md); position: sticky; top: var(--space-lg); }
.col-head { display: flex; align-items: center; gap: var(--space-xs); }
.col-head h2 { font-size: var(--font-size-lg); }
.col-head .btn { margin-inline-start: auto; }
.count { font-family: var(--font-code); font-size: var(--font-size-xs); color: var(--color-text-muted); }
.rows { display: grid; gap: var(--space-2xs); }
.row {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--color-bg-canvas);
}
.row-text { flex: 1; min-width: 0; }
.row-text p, .milestone-text p { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--space-2xs); }
.row-actions { display: flex; gap: var(--space-2xs); align-items: center; flex-shrink: 0; }
.icon { padding: var(--space-2xs); }
.badge {
  margin-inline-start: var(--space-2xs);
  font-size: var(--font-size-xs);
  padding: 0 var(--space-xs);
  border: var(--border-width-thin) solid var(--color-secondary-border);
  border-radius: var(--radius-full);
  color: var(--color-secondary-subtle-fg);
}
.empty { padding: var(--space-md); text-align: center; font-size: var(--font-size-sm); color: var(--color-text-muted); }
.drop { border: var(--border-width-thick) dashed var(--color-border-default); border-radius: var(--radius-md); }
.tray { display: flex; flex-wrap: wrap; gap: var(--space-2xs); align-items: center; padding-top: var(--space-xs); border-top: var(--border-width-thin) solid var(--color-border-subtle); }
.tray-label { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-inline-end: var(--space-2xs); }
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  max-width: 14rem;
  padding: 0 var(--space-xs);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  cursor: pointer;
}
.chip s { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chip:hover { color: var(--color-text-primary); }
.milestones { display: grid; gap: 0; }
.milestone { display: flex; gap: var(--space-sm); align-items: flex-start; padding: var(--space-sm) 0; border-bottom: var(--border-width-thin) solid var(--color-border-subtle); animation: enter var(--duration-normal) var(--ease-out); }
@keyframes enter { from { opacity: 0; translate: -12px 0; } }
.step {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--color-success-subtle-bg);
  color: var(--color-success-subtle-fg);
  font-family: var(--font-code);
  font-size: var(--font-size-sm);
}
.milestone-text { flex: 1; min-width: 0; }
.add { justify-self: start; }
.col-foot { display: grid; gap: var(--space-2xs); padding-top: var(--space-sm); }
.note { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.drawer {
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;
  z-index: var(--z-modal);
  width: min(28rem, 100vw);
  padding: var(--space-lg);
  display: grid;
  align-content: start;
  gap: var(--space-md);
  background: var(--color-bg-surface);
  border-inline-start: var(--border-width-thin) solid var(--color-border-default);
  box-shadow: var(--shadow-lg);
  animation: slide var(--duration-normal) var(--ease-out);
}
@keyframes slide { from { translate: 100% 0; } }
.drawer h2 { font-size: var(--font-size-xl); }
.drawer-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.edit-form { display: grid; gap: var(--space-md); }
.field small { justify-self: end; font-size: var(--font-size-xs); color: var(--color-text-muted); }
</style>
