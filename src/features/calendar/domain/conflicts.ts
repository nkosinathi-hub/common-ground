import { addDays } from "./days"
import { type CalendarEntry } from "./agenda"
import type { EventTiming } from "./types"
import { startOfDay } from "./zone"

/** The instants an event covers; all-day events cover the viewer's whole local days. */
function interval(timing: EventTiming, zone: string): [number, number] {
  if (timing.allDay)
    return [startOfDay(timing.startDate, zone), startOfDay(addDays(timing.endDate, 1), zone)]
  const start = Date.parse(timing.startsAt)
  return [start, Math.max(start + 1, Date.parse(timing.endsAt))]
}

/** Other events the viewer is going to that overlap this one (a warning, never a block). */
export function conflicts(
  target: { readonly id: string; readonly timing: EventTiming },
  entries: readonly CalendarEntry[],
  zone: string,
): CalendarEntry[] {
  const [start, end] = interval(target.timing, zone)
  return entries.filter((entry) => {
    if (entry.kind !== "event" || entry.myRsvp !== "going" || entry.id === target.id) return false
    const [s, e] = interval(entry.timing, zone)
    return s < end && start < e
  })
}
