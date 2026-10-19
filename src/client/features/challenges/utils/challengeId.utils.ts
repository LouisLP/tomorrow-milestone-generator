/** Route ids are positive integers; `null` for anything else. */
export function parseChallengeId(value: string): number | null {
  const id = Number(value)
  return /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : null
}
