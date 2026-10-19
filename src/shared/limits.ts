/** Max length of each text field, counted after trimming. */
export const LIMITS = {
  challengeTitle: 120,
  brief: 4000,
  milestoneTitle: 120,
  milestoneDescription: 1000,
} as const

/** Most Milestones a Challenge can own. */
export const MILESTONE_CAP = 20

/** How many Draft Milestones one generation must return. */
export const GENERATED_MIN = 3
export const GENERATED_MAX = 5
