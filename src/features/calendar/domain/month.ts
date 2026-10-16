import type { DateOnly } from "@/shared/domain"
import { addDays, addMonths, dateOf, monthOf, weekday } from "./days"

/** 0 Sunday or 1 Monday, as in spaces.week_starts_on. */
export type WeekStart = 0 | 1

/** Six weeks of days covering a month, starting on the space's first day of the week. */
export function monthGrid(year: number, month: number, weekStart: WeekStart = 1): DateOnly[] {
  const first = dateOf(year, month, 1)
  const lead = (weekday(first) - weekStart + 7) % 7
  const start = addDays(first, -lead)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

/** The same day of another month, clamped to that month's last day. */
function shiftMonth(day: DateOnly, months: number): DateOnly {
  const target = addMonths(monthOf(day), months)
  const last = addDays(dateOf(target.year, target.month + 1, 1), -1)
  const wanted = dateOf(target.year, target.month, Number(day.slice(8, 10)))
  return wanted > last ? last : wanted
}

/** Where focus goes in the month grid for a key (ARIA grid pattern), or null for other keys. */
export function gridMove(day: DateOnly, key: string, weekStart: WeekStart): DateOnly | null {
  const column = (weekday(day) - weekStart + 7) % 7
  switch (key) {
    case "ArrowRight":
      return addDays(day, 1)
    case "ArrowLeft":
      return addDays(day, -1)
    case "ArrowDown":
      return addDays(day, 7)
    case "ArrowUp":
      return addDays(day, -7)
    case "Home":
      return addDays(day, -column)
    case "End":
      return addDays(day, 6 - column)
    case "PageDown":
      return shiftMonth(day, 1)
    case "PageUp":
      return shiftMonth(day, -1)
    default:
      return null
  }
}
