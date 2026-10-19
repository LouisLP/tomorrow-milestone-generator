<!--
  Click-to-edit text (Reka Editable): focus or click the text to edit, Esc cancels.
  `value` is the last saved value; the field shows the edited text while the parent saves
  it. To report a failed save, set `error` (clear it before each save): the field reverts
  to `value` and shows the error next to it.
-->
<script setup lang="ts">
import { EditableArea, EditableInput, EditablePreview, EditableRoot } from 'reka-ui'
import { computed, ref, useId, useTemplateRef, watch } from 'vue'

const props = withDefaults(defineProps<{
  value: string
  label: string
  maxlength?: number
  placeholder?: string
  multiline?: boolean
  submitMode?: 'blur' | 'enter' | 'both' | 'none'
  /** Element the saved text renders as, e.g. 'h3' for a title */
  as?: string
  error?: string
  disabled?: boolean
}>(), {
  // Reka's own default placeholder is English
  placeholder: '',
  as: 'span',
})

const emit = defineEmits<{ submit: [value: string] }>()

const draft = ref(props.value)
const errorId = useId()
const root = useTemplateRef('root')

// A textarea needs Enter for newlines, so it submits on blur unless told otherwise
const mode = computed(() => props.submitMode ?? (props.multiline ? 'blur' : 'both'))

watch(() => props.value, (saved) => {
  draft.value = saved
})

watch(() => props.error, (error) => {
  if (error)
    draft.value = props.value
})

function onSubmit(value: string | null | undefined) {
  const next = value ?? ''
  if (next !== props.value)
    emit('submit', next)
}

// Reka misses focus moving straight into another Editable (each is its own dismissable
// layer), e.g. tabbing from a title to its description, so handle leaving the input here.
// Esc/Enter hide the input, which blurs it after Reka has already settled the edit
const editing = ref(false)

function onInputBlur(event: FocusEvent) {
  if (!editing.value)
    return
  const next = event.relatedTarget
  if (next instanceof Node && root.value?.$el.contains(next))
    return
  if (mode.value === 'blur' || mode.value === 'both')
    root.value?.submit()
  else
    root.value?.cancel()
}

defineExpose({ edit: () => root.value?.edit() })
</script>

<template>
  <div class="editable" :data-empty="draft === '' || undefined">
    <EditableRoot
      ref="root"
      v-model="draft"
      :placeholder="placeholder"
      :max-length="maxlength"
      :submit-mode="mode"
      :disabled="disabled"
      select-on-focus
      @submit="onSubmit"
      @update:state="state => editing = state === 'edit'"
    >
      <EditableArea class="area">
        <EditablePreview :as="as" class="preview" />
        <EditableInput
          :as="multiline ? 'textarea' : 'input'"
          class="input"
          :aria-label="label"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="error ? errorId : undefined"
          @blur="onInputBlur"
        />
      </EditableArea>
    </EditableRoot>
    <span v-if="error" :id="errorId" class="error" role="alert">{{ error }}</span>
  </div>
</template>

<style scoped>
.editable {
  display: grid;
  gap: var(--space-2xs);
}

.area {
  display: grid;
}

/* Reka toggles preview and input with the hidden attribute */
.area > [hidden] {
  display: none;
}

.preview {
  margin: 0;
  /* Keep the description's line breaks */
  white-space: pre-wrap;
  padding: var(--space-2xs) var(--space-xs);
  margin-inline: calc(-1 * var(--space-xs));
  border-radius: var(--radius-sm);
  cursor: text;
  transition: background var(--duration-fast) var(--ease-out);
}

.preview:hover {
  background: var(--color-bg-surface-hover);
}

.editable[data-empty] .preview {
  color: var(--color-text-muted);
}

.input {
  box-sizing: border-box;
  inline-size: calc(100% + 2 * var(--space-xs));
  margin-inline: calc(-1 * var(--space-xs));
  padding: var(--space-2xs) var(--space-xs);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--radius-sm);
  background: var(--color-bg-canvas);
  color: var(--color-text-primary);
  font: inherit;
}

textarea.input {
  min-block-size: 3lh;
  resize: vertical;
}

.error {
  color: var(--color-danger-subtle-fg);
  font-size: var(--font-size-sm);
}
</style>
