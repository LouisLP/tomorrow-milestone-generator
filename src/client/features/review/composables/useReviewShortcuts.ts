// A / R / S / E act on the current draft, Cmd/Ctrl+Z undoes; none fire while typing or in a dialog
import { onScopeDispose } from 'vue'

export interface ReviewShortcutHandlers {
  accept: () => void
  reject: () => void
  skip: () => void
  edit: () => void
  undo: () => void
}

export const isApplePlatform = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

const TYPING_TARGET = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
const DIALOG = '[role="dialog"], [role="alertdialog"]'

const KEYS: Partial<Record<string, Exclude<keyof ReviewShortcutHandlers, 'undo'>>> = {
  a: 'accept',
  r: 'reject',
  s: 'skip',
  e: 'edit',
}

function isBlocked(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing)
    return true
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest(TYPING_TARGET))
    return true
  return document.querySelector(DIALOG) !== null
}

export function useReviewShortcuts(handlers: ReviewShortcutHandlers) {
  function onKeydown(event: KeyboardEvent) {
    if (isBlocked(event))
      return
    const key = event.key.toLowerCase()

    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && key === 'z') {
      event.preventDefault()
      handlers.undo()
      return
    }
    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
      return

    const action = KEYS[key]
    if (!action)
      return
    // Keeps E from typing into the field it opens
    event.preventDefault()
    handlers[action]()
  }

  window.addEventListener('keydown', onKeydown)
  onScopeDispose(() => window.removeEventListener('keydown', onKeydown))
}
