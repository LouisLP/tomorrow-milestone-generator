import type { ErrorCode } from '../../../api'

// Source catalogue: de.ts and it.ts must match this shape.
export default {
  app: {
    name: 'Milestone Generator',
    skipToContent: 'Skip to main content',
  },
  language: {
    label: 'Language',
  },
  actions: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    retry: 'Retry',
    save: 'Save',
    delete: 'Delete',
    undo: 'Undo',
    done: 'Done',
    edit: 'Edit',
    close: 'Close',
    backToList: 'Back to challenges',
  },
  // `aborted` is never shown: the user cancelled on purpose.
  errors: {
    validation_failed: 'Some fields need fixing.',
    not_found: 'This challenge no longer exists.',
    milestone_cap_exceeded: 'A challenge can have at most {cap} milestones. Accept fewer drafts.',
    last_milestone: 'A challenge needs at least one milestone. Delete the challenge instead.',
    generation_refused: 'The AI declined to draft milestones for this brief. Try rephrasing it.',
    generation_invalid: 'The AI returned milestones we couldn\'t use. Try again.',
    generation_rate_limited: 'The AI service is busy right now. Wait a moment and try again.',
    generation_unavailable: 'Couldn\'t reach the AI service. Try again.',
    internal: 'Something went wrong. Try again.',
    network_error: 'You appear to be offline. Check your connection and try again.',
    unexpected_response: 'Something went wrong. Try again.',
    unknown: 'Something went wrong. Try again.',
  } satisfies Record<Exclude<ErrorCode, 'aborted'>, string>,
  validation: {
    required: 'This field is required.',
    tooLong: 'Use at most {max} characters.',
    invalid: 'This value isn\'t valid.',
  },
}
