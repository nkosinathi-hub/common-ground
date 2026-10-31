import type { DateOnly } from "@/shared/domain"

/** A calendar month: month is 1 to 12. */
export interface YearMonth {
  readonly year: number
  readonly month: number
}

const DAY_MS = 86_400_000

// DateOnly arithmetic in UTC, so no local clock or DST change can move a day.
const toMs = (day: DateOnly): number => {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number]
  return Date.UTC(y, m - 1, d)
}
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10) as DateOnly

export const dateOf = (year: number, month: number, day: number): DateOnly =>
  fromMs(Date.UTC(year, month - 1, day))

export const addDays = (day: DateOnly, days: number): DateOnly => fromMs(toMs(day) + days * DAY_MS)

export const daysBetween = (from: DateOnly, to: DateOnly): number =>
  Math.round((toMs(to) - toMs(from)) / DAY_MS)

/** 0 is Sunday, as in Date.getDay and spaces.week_starts_on. */
export const weekday = (day: DateOnly): number => new Date(toMs(day)).getUTCDay()

/** Every day from `from` to `to` inclusive. */
export function eachDay(from: DateOnly, to: DateOnly): DateOnly[] {
  const count = daysBetween(from, to) + 1
  return Array.from({ length: Math.max(0, count) }, (_, i) => addDays(from, i))
}

export function addMonths(at: YearMonth, months: number): YearMonth {
  const index = at.year * 12 + (at.month - 1) + months
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export const monthOf = (day: DateOnly): YearMonth => ({
  year: Number(day.slice(0, 4)),
  month: Number(day.slice(5, 7)),
})

/** The last day of the month a day falls in. */
export function monthEnd(day: DateOnly): DateOnly {
  const next = addMonths(monthOf(day), 1)
  return addDays(dateOf(next.year, next.month, 1), -1)
}
