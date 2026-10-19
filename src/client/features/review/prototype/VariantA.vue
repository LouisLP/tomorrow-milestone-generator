<!--
  PROTOTYPE (#6) Variant A, "Inline card list".
  All drafts stacked as full cards. Accept/Reject is a toggle group (click again = back to
  undecided, so no undo stack). Click text to edit in place (Reka Editable). Rejected cards
  collapse to a slim row. Sticky footer Save; confirm if undecided drafts would be dropped.
-->
<script setup lang="ts">
import { EditableArea, EditableEditTrigger, EditableInput, EditablePreview, EditableRoot, ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { ref } from 'vue'
import IconCheck from '~icons/lucide/check'
import IconCheckCheck from '~icons/lucide/check-check'
import IconPencil from '~icons/lucide/pencil'
import IconPlus from '~icons/lucide/plus'
import IconTrash from '~icons/lucide/trash-2'
import IconUndo from '~icons/lucide/undo-2'
import IconX from '~icons/lucide/x'
import ConfirmDialog from './ConfirmDialog.vue'
import type { DraftState } from './useDraftReview'
import { useDraftReview } from './useDraftReview'

const { status, drafts, counts, canSave, setState, edit, acceptAllUndecided, addStaffDraft, removeDraft, save } = useDraftReview()
const freshKey = ref<string>()
const confirmSave = ref(false)

function onToggle(key: string, v: unknown) {
  setState(key, (v as DraftState | undefined) ?? 'undecided')
}

function onSave() {
  if (counts.value.undecided)
    confirmSave.value = true
  else
    save()
}

function acceptAllAndSave() {
  acceptAllUndecided()
  save()
}
</script>

<template>
  <section v-if="drafts.length" class="review" aria-labelledby="review-h">
    <div class="toolbar">
      <h2 id="review-h">
        Review drafts
      </h2>
      <p class="summary" aria-live="polite">
        <span class="chip chip--accepted">{{ counts.accepted }} accepted</span>
        <span class="chip">{{ counts.undecided }} undecided</span>
        <span class="chip chip--rejected">{{ counts.rejected }} rejected</span>
      </p>
      <button class="btn btn--ghost" :disabled="!counts.undecided" @click="acceptAllUndecided">
        <IconCheckCheck /> Accept all undecided
      </button>
    </div>

    <ol class="list">
      <li v-for="(d, i) in drafts" :key="d.key" class="card" :data-state="d.pending ? 'pending' : d.state">
        <template v-if="d.pending">
          <div class="skeleton" style="height: 1.25rem; width: 55%" />
          <div class="skeleton" style="height: 0.9rem; width: 90%" />
          <div class="skeleton" style="height: 0.9rem; width: 70%" />
        </template>

        <template v-else-if="d.state === 'rejected'">
          <div class="rejected-row">
            <span class="num">{{ i + 1 }}</span>
            <s>{{ d.title }}</s>
            <button class="btn btn--ghost" @click="setState(d.key, 'undecided')">
              <IconUndo /> Restore
            </button>
          </div>
        </template>

        <template v-else>
          <div class="card-head">
            <span class="num">{{ i + 1 }}</span>
            <EditableRoot
              v-slot="{ isEditing }"
              :model-value="d.title"
              submit-mode="both"
              :start-with-edit-mode="d.key === freshKey"
              select-on-focus
              class="title-edit"
              @submit="v => edit(d.key, { title: v ?? '' })"
            >
              <EditableArea class="area">
                <EditablePreview class="title" />
                <EditableInput class="input title-input" maxlength="120" />
              </EditableArea>
              <EditableEditTrigger v-if="!isEditing" class="btn btn--ghost icon" aria-label="Edit title">
                <IconPencil />
              </EditableEditTrigger>
            </EditableRoot>
            <span v-if="d.origin === 'staff'" class="badge">Written by you</span>
            <span v-else-if="d.edited" class="badge">Edited</span>
          </div>

          <EditableRoot
            :model-value="d.description"
            submit-mode="blur"
            class="desc-edit"
            @submit="v => edit(d.key, { description: v ?? '' })"
          >
            <EditableArea class="area">
              <EditablePreview class="desc" />
              <EditableInput as="textarea" class="input" rows="3" maxlength="1000" />
            </EditableArea>
          </EditableRoot>

          <div class="card-actions">
            <ToggleGroupRoot
              v-if="d.origin === 'ai'"
              type="single"
              :model-value="d.state === 'undecided' ? undefined : d.state"
              class="toggle"
              :aria-label="`Decision for ${d.title}`"
              @update:model-value="v => onToggle(d.key, v)"
            >
              <ToggleGroupItem value="accepted" class="toggle-item toggle-item--accept">
                <IconCheck /> Accept
              </ToggleGroupItem>
              <ToggleGroupItem value="rejected" class="toggle-item toggle-item--reject">
                <IconX /> Reject
              </ToggleGroupItem>
            </ToggleGroupRoot>
            <button v-else class="btn btn--ghost" @click="removeDraft(d.key)">
              <IconTrash /> Remove
            </button>
          </div>
        </template>
      </li>

      <li v-if="status !== 'generating'">
        <button class="add" @click="freshKey = addStaffDraft()">
          <IconPlus /> Write your own milestone
        </button>
      </li>
    </ol>

    <footer class="savebar">
      <span>
        <strong>{{ counts.accepted }}</strong> {{ counts.accepted === 1 ? 'milestone' : 'milestones' }} will be saved
        <template v-if="counts.undecided"> · {{ counts.undecided }} still undecided</template>
      </span>
      <button class="btn btn--primary btn--lg" :disabled="!canSave" @click="onSave">
        Save challenge
      </button>
    </footer>
  </section>

  <ConfirmDialog
    v-model:open="confirmSave"
    :title="`${counts.undecided} drafts are still undecided`"
    description="Only accepted drafts are saved. Undecided ones will be discarded."
    confirm-label="Discard and save"
    alt-label="Accept them too"
    @confirm="save"
    @alt="acceptAllAndSave"
  />
</template>

<style scoped>
.review { display: grid; gap: var(--space-md); }
.toolbar { display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap; }
.toolbar h2 { font-size: var(--font-size-xl); margin-inline-end: auto; }
.summary { display: flex; gap: var(--space-2xs); }
.chip {
  padding: 0 var(--space-xs);
  border-radius: var(--radius-full);
  background: var(--color-bg-surface-raised);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
.chip--accepted { background: var(--color-success-subtle-bg); color: var(--color-success-subtle-fg); }
.chip--rejected { color: var(--color-text-muted); }

.list { display: grid; gap: var(--space-sm); }
.card {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-inline-start: 4px solid var(--color-border-default);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  transition: border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out);
}
.card[data-state='accepted'] { border-inline-start-color: var(--color-success-default); background: color-mix(in oklch, var(--color-success-subtle-bg) 40%, var(--color-bg-surface)); }
.card[data-state='rejected'] { padding-block: var(--space-xs); background: transparent; border-style: dashed; color: var(--color-text-muted); }
.card-head { display: flex; align-items: center; gap: var(--space-xs); }
.num { font-family: var(--font-code); font-size: var(--font-size-sm); color: var(--color-text-muted); min-width: 1.5em; }
.title-edit { display: flex; align-items: center; gap: var(--space-2xs); flex: 1; min-width: 0; }
.area { flex: 1; min-width: 0; }
.title { font-weight: var(--font-weight-semibold); font-size: var(--font-size-lg); cursor: text; }
.title-input { font-weight: var(--font-weight-semibold); }
.desc { color: var(--color-text-secondary); cursor: text; display: block; }
.desc-edit { padding-inline-start: calc(1.5em + var(--space-xs)); }
.icon { padding: var(--space-2xs); }
.badge {
  font-size: var(--font-size-xs);
  padding: 0 var(--space-xs);
  border: var(--border-width-thin) solid var(--color-secondary-border);
  border-radius: var(--radius-full);
  color: var(--color-secondary-subtle-fg);
  white-space: nowrap;
}
.card-actions { display: flex; justify-content: flex-end; }
.toggle { display: inline-flex; border: var(--border-width-thin) solid var(--color-border-default); border-radius: var(--radius-md); overflow: hidden; }
.toggle-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-2xs) var(--space-sm);
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.toggle-item + .toggle-item { border-inline-start: var(--border-width-thin) solid var(--color-border-default); }
.toggle-item:hover { background: var(--color-bg-surface-hover); }
.toggle-item--accept[data-state='on'] { background: var(--color-success-default); color: var(--color-text-on-accent); }
.toggle-item--reject[data-state='on'] { background: var(--color-bg-surface-hover); color: var(--color-text-primary); }
.rejected-row { display: flex; align-items: center; gap: var(--space-xs); }
.rejected-row s { flex: 1; }
.add {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: var(--border-width-thick) dashed var(--color-border-default);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}
.add:hover { color: var(--color-text-primary); border-color: var(--color-text-muted); }
.savebar {
  position: sticky;
  bottom: var(--space-4xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface-raised);
  box-shadow: var(--shadow-lg);
  flex-wrap: wrap;
}
</style>
