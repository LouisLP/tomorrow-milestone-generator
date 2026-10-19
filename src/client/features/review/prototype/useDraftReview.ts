// PROTOTYPE (#6): in-memory mock of the review state from #4. No LLM, no API, no persistence.
// Module-level singleton so the variant switch keeps the same drafts.
import { computed, ref } from 'vue'

export type DraftState = 'undecided' | 'accepted' | 'rejected'

export interface Draft {
  key: string
  title: string
  description: string
  state: DraftState
  edited: boolean
  origin: 'ai' | 'staff'
  /** true while a regenerate is replacing this slot (skeleton) */
  pending?: boolean
}

const POOLS: Array<Array<[string, string]>> = [
  [
    ['Sketch the core screens', 'Wireframe the dashboard, transaction list and budget editor on paper or Figma. Keep it to three screens.'],
    ['Model income and expenses', 'Define the data shape for a transaction (amount, category, date, note) and seed ten realistic rows.'],
    ['Build the transaction list', 'Render seeded transactions, newest first, with category filter and a running monthly total.'],
    ['Add monthly budgets per category', 'Let the user set a monthly limit per category and show progress bars that turn orange past 80%.'],
    ['Ship a demo to a friend', 'Deploy a preview, watch one person use it for five minutes, and write down three things that confused them.'],
  ],
  [
    ['Interview two future users', 'Ask two people how they track money today. Note one pain point each that the app must solve.'],
    ['Pick a stack and scaffold', 'Create the project, add linting and a first passing test. Commit before writing features.'],
    ['Import a bank CSV', 'Parse a CSV export from a real bank, map its columns to transactions and reject malformed rows with a message.'],
    ['Visualise spending trends', 'Add one chart comparing this month with the last three, per category.'],
  ],
  [
    ['Write the one-sentence pitch', 'Describe who the app is for and what it saves them, in one sentence a stranger understands.'],
    ['Handle recurring expenses', 'Let rent and subscriptions repeat monthly without retyping them, with a way to stop a series.'],
    ['Polish empty and error states', 'Every screen gets a friendly empty state and a recoverable error message.'],
  ],
]

let poolIndex = 0
const GENERATE_MS = 1600
export const CAP = 20

const title = ref('Build a personal budget app')
const brief = ref('Learners build a small web app that tracks income and expenses, sets monthly budgets per category and shows where the money went. Aimed at first-year bootcamp students, about two weeks of part-time work.')
const status = ref<'idle' | 'generating' | 'ready' | 'saved'>('idle')
const drafts = ref<Draft[]>([])
const saved = ref<Array<{ title: string, description: string }>>([])
const lastAction = ref('—')
const history = ref<Draft[][]>([])

function snapshot() {
  history.value.push(structuredClone(drafts.value.map(d => ({ ...d }))))
  if (history.value.length > 50)
    history.value.shift()
}

function nextBatch(): Draft[] {
  const pool = POOLS[poolIndex % POOLS.length]!
  poolIndex++
  return pool.map(([t, d]) => ({
    key: crypto.randomUUID(),
    title: t,
    description: d,
    state: 'undecided',
    edited: false,
    origin: 'ai',
  }))
}

const counts = computed(() => ({
  undecided: drafts.value.filter(d => d.state === 'undecided' && !d.pending).length,
  accepted: drafts.value.filter(d => d.state === 'accepted').length,
  rejected: drafts.value.filter(d => d.state === 'rejected').length,
}))

/** #4: regenerate replaces undecided + rejected; confirm only if that discards edits */
const regenerateDiscardsEdits = computed(() =>
  drafts.value.some(d => d.state !== 'accepted' && d.edited),
)

async function generate() {
  if (status.value === 'generating')
    return
  const isRegenerate = drafts.value.length > 0
  status.value = 'generating'
  lastAction.value = isRegenerate ? 'regenerate (keeping accepted)' : 'generate'
  // keep accepted visible, turn the rest into skeleton slots while waiting
  drafts.value = drafts.value
    .filter(d => d.state === 'accepted')
    .concat(drafts.value.filter(d => d.state !== 'accepted').map(d => ({ ...d, state: 'undecided' as const, pending: true })))
  if (!isRegenerate)
    drafts.value = Array.from({ length: 4 }, () => ({ key: crypto.randomUUID(), title: '', description: '', state: 'undecided' as const, edited: false, origin: 'ai' as const, pending: true }))
  await new Promise(r => setTimeout(r, GENERATE_MS))
  history.value = []
  drafts.value = drafts.value.filter(d => !d.pending).concat(nextBatch()).slice(0, CAP)
  status.value = 'ready'
}

function setState(key: string, state: DraftState) {
  const d = drafts.value.find(x => x.key === key)
  if (!d || d.state === state)
    return
  snapshot()
  d.state = state
  lastAction.value = `${state}: "${d.title}"`
}

function edit(key: string, patch: { title?: string, description?: string }) {
  const d = drafts.value.find(x => x.key === key)
  if (!d)
    return
  const nextTitle = patch.title?.trim() ?? d.title
  const nextDesc = patch.description?.trim() ?? d.description
  if (nextTitle === d.title && nextDesc === d.description)
    return
  snapshot()
  d.title = nextTitle || d.title
  d.description = nextDesc || d.description
  d.edited = true
  lastAction.value = `edit: "${d.title}" (state unchanged: ${d.state})`
}

function acceptAllUndecided() {
  if (!counts.value.undecided)
    return
  snapshot()
  for (const d of drafts.value) {
    if (d.state === 'undecided' && !d.pending)
      d.state = 'accepted'
  }
  lastAction.value = 'accept all undecided'
}

/** OPEN QUESTION: staff-written drafts start accepted (writing it is the decision) */
function addStaffDraft(t = '', desc = ''): string {
  snapshot()
  const key = crypto.randomUUID()
  drafts.value.push({ key, title: t || 'New milestone', description: desc || 'Describe what the learner does.', state: 'accepted', edited: false, origin: 'staff' })
  status.value = status.value === 'idle' ? 'ready' : status.value
  lastAction.value = 'add staff-written milestone (accepted)'
  return key
}

function removeDraft(key: string) {
  snapshot()
  drafts.value = drafts.value.filter(d => d.key !== key)
  lastAction.value = 'remove staff draft'
}

function undo() {
  const prev = history.value.pop()
  if (!prev)
    return false
  drafts.value = prev
  lastAction.value = 'undo'
  return true
}

/** #4: save sends only accepted, current text; undecided + rejected are dropped */
function save() {
  saved.value = drafts.value.filter(d => d.state === 'accepted').map(({ title, description }) => ({ title, description }))
  status.value = 'saved'
  lastAction.value = `save (${saved.value.length} milestones, ${counts.value.undecided} undecided dropped)`
}

function reset() {
  drafts.value = []
  saved.value = []
  history.value = []
  poolIndex = 0
  status.value = 'idle'
  lastAction.value = 'reset'
}

export function useDraftReview() {
  return {
    title,
    brief,
    status,
    drafts,
    saved,
    counts,
    lastAction,
    canUndo: computed(() => history.value.length > 0),
    canSave: computed(() => counts.value.accepted > 0 && status.value !== 'generating'),
    regenerateDiscardsEdits,
    generate,
    setState,
    edit,
    acceptAllUndecided,
    addStaffDraft,
    removeDraft,
    undo,
    save,
    reset,
  }
}
