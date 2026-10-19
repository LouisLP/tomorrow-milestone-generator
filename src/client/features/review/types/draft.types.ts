export type DraftState = 'undecided' | 'accepted' | 'rejected'

export interface Draft {
  key: string
  title: string
  description: string
  state: DraftState
  /** Deferred, not decided: the draft stays undecided. */
  skipped: boolean
  edited: boolean
  origin: 'ai' | 'staff'
}

export type ReviewStatus = 'idle' | 'generating' | 'ready'

/** The last undoable change, for the snackbar text. */
export type ReviewAction
  = | { kind: 'accept' | 'reject' | 'reset' | 'skip' | 'unskip' | 'edit' | 'add' | 'remove', title: string }
    | { kind: 'acceptRemaining', count: number }
