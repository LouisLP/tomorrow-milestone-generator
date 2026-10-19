import type { FieldKey, MilestoneField } from '../types/challenge.types'

export function milestoneFieldKey(milestoneId: number, field: MilestoneField): FieldKey {
  return `milestone.${milestoneId}.${field}`
}
