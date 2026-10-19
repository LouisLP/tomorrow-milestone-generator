<!--
  Click-to-edit text. Enter saves (Shift+Enter is a newline when `multiline`), Esc cancels.
  Set `error` after a failed save and the text reverts to `value`.
-->
<script setup lang="ts">
import { EditableArea, EditableInput, EditablePreview, EditableRoot } from 'reka-ui'
import { nextTick, ref, useId, useTemplateRef, watch } from 'vue'

const props = withDefaults(defineProps<{
  value: string
  label: string
  maxlength?: number
  multiline?: boolean
  /** Wraps both the text and the input, so they share its typography */
  as?: string
  id?: string
  error?: string
  disabled?: boolean
}>(), {
  as: 'span',
})

const emit = defineEmits<{ submit: [value: string] }>()

const draft = ref(props.value)
const errorId = useId()
const root = useTemplateRef('root')
const editing = ref(false)

watch(() => props.value, (saved) => {
  draft.value = saved
})

watch(() => props.error, (error) => {
  if (error)
    draft.value = props.value
})

function onSubmit(value: string | null | undefined) {
  const next = props.multiline ? value ?? '' : (value ?? '').replace(/\s*\n\s*/g, ' ')
  if (next !== props.value)
    emit('submit', next)
}

function textarea() {
  return root.value?.$el.querySelector('textarea') as HTMLTextAreaElement | null | undefined
}

// Grows with its content, like the text it replaces
function fit() {
  const element = textarea()
  if (!element)
    return
  element.style.blockSize = 'auto'
  element.style.blockSize = `${element.scrollHeight + element.offsetHeight - element.clientHeight}px`
}

watch(editing, async (isEditing) => {
  if (!isEditing)
    return
  await nextTick()
  fit()
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.isComposing && !(props.multiline && event.shiftKey))
    event.preventDefault()
}

// Reka misses focus moving straight into another Editable (e.g. title → description)
function onInputBlur(event: FocusEvent) {
  if (!editing.value)
    return
  const next = event.relatedTarget
  if (!(next instanceof Node && root.value?.$el.contains(next)))
    root.value?.submit()
}

defineExpose({ edit: () => root.value?.edit() })
</script>

<template>
  <div class="editable" :data-empty="draft === '' || undefined">
    <component :is="as" :id="id" class="text">
      <EditableRoot
        ref="root"
        v-model="draft"
        as="span"
        class="root"
        placeholder=""
        :max-length="maxlength"
        submit-mode="both"
        :disabled="disabled"
        select-on-focus
        @submit="onSubmit"
        @update:state="state => editing = state === 'edit'"
      >
        <EditableArea as="span" class="area">
          <EditablePreview class="preview" />
          <EditableInput
            as="textarea"
            rows="1"
            class="input"
            :aria-label="label"
            :aria-multiline="multiline ? undefined : 'false'"
            :aria-invalid="error ? 'true' : undefined"
            :aria-describedby="error ? errorId : undefined"
            @keydown="onKeydown"
            @input="fit"
            @blur="onInputBlur"
          />
        </EditableArea>
      </EditableRoot>
    </component>
    <span v-if="error" :id="errorId" class="error" role="alert">{{ error }}</span>
  </div>
</template>

<style scoped>
.editable {
  display: grid;
  gap: var(--space-2xs);
}

.root,
.area {
  display: grid;
}

/* Reka toggles preview and input with the hidden attribute */
.area > [hidden] {
  display: none;
}

/* Same box for text and input, so switching between them doesn't move anything */
.preview,
.input {
  margin-inline: calc(-1 * var(--space-xs));
  padding: var(--space-2xs) var(--space-xs);
  border: var(--border-width-thin) solid transparent;
  border-radius: var(--radius-sm);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  hyphens: auto;
}

.preview {
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
  display: block;
  inline-size: calc(100% + 2 * var(--space-xs));
  overflow: hidden;
  border-color: var(--color-border-default);
  background: var(--color-bg-canvas);
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  resize: none;
}

.error {
  color: var(--color-danger-subtle-fg);
  font-size: var(--font-size-sm);
}
</style>
