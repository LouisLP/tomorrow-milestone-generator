const UNITS = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
] as const satisfies readonly (readonly [Intl.RelativeTimeFormatUnit, number])[]

/** "3 hours ago" in the largest whole unit; under a minute is "now". */
export function formatRelativeTime(date: Date | string, locale: string, now: Date = new Date()): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const seconds = (new Date(date).getTime() - now.getTime()) / 1000

  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size)
      return format.format(Math.trunc(seconds / size), unit)
  }
  return format.format(0, 'second')
}
