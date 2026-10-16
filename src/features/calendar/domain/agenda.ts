import type { DateOnly } from "@/shared/domain"
import { eachDay } from "./days"
import type { EventTiming, Rsvp } from "./types"
import { localDay } from "./zone"

export type EntryKind = "event" | "occasion" | "task" | "milestone"

/** One row of a calendar window: an event, one yearly occurrence, a task due or a milestone. */
export interface CalendarEntry {
  readonly kind: EntryKind
  readonly id: string
  readonly title: string
  readonly timing: EventTiming
  readonly ideaId: string | null
  /** Task status, or "open"/"done" for milestones. */
  readonly status: string | null
  readonly myRsvp: Rsvp | null
}

export type Span = "single" | "start" | "middle" | "end"

export interface DayItem {
  readonly key: string
  readonly entry: CalendarEntry
  readonly span: Span
}

/** The first and last local day an entry covers. All-day dates never convert. */
export function coveredDays(timing: EventTiming, zone: string): [DateOnly, DateOnly] {
  if (timing.allDay) return [timing.startDate, timing.endDate]
  const start = Date.parse(timing.startsAt)
  // An end exactly at midnight belongs to the day before.
  const end = Math.max(start, Date.parse(timing.endsAt) - 1)
  return [localDay(start, zone), localDay(end, zone)]
}

const startDay = (entry: CalendarEntry) =>
  entry.timing.allDay ? entry.timing.startDate : entry.timing.startsAt

/** Stable across windows; yearly occurrences of one event differ by date. */
export const entryKey = (entry: CalendarEntry) => `${entry.kind}:${entry.id}:${startDay(entry)}`

const RANK: Record<EntryKind, number> = { occasion: 0, event: 0, milestone: 2, task: 3 }

function rank(item: DayItem): number {
  const timedOnItsDay = !item.entry.timing.allDay && item.span !== "middle"
  return timedOnItsDay ? 1 : RANK[item.entry.kind]
}

function compare(a: DayItem, b: DayItem): number {
  const byRank = rank(a) - rank(b)
  if (byRank) return byRank
  const [sa, sb] = [startDay(a.entry), startDay(b.entry)]
  if (rank(a) === 1 && sa !== sb) return sa < sb ? -1 : 1
  return a.entry.title.localeCompare(b.entry.title)
}

function spanOf(day: DateOnly, first: DateOnly, last: DateOnly): Span {
  if (first === last) return "single"
  if (day === first) return "start"
  return day === last ? "end" : "middle"
}

/** Entries by local day within [from, to], in day order, each day sorted for display. */
export function entriesByDay(
  entries: readonly CalendarEntry[],
  from: DateOnly,
  to: DateOnly,
  zone: string,
): Map<DateOnly, DayItem[]> {
  const byDay = new Map<DateOnly, DayItem[]>()
  for (const entry of entries) {
    const [first, last] = coveredDays(entry.timing, zone)
    const days = eachDay(first < from ? from : first, last > to ? to : last)
    for (const day of days) {
      const item = { key: entryKey(entry), entry, span: spanOf(day, first, last) }
      byDay.set(day, [...(byDay.get(day) ?? []), item])
    }
  }
  const ordered = [...byDay.keys()].sort()
  return new Map(ordered.map((day) => [day, byDay.get(day)!.sort(compare)]))
}
