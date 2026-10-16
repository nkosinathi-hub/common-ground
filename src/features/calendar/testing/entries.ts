import { appError, err } from "@/shared/domain"
import type { CalendarEntry, CalendarEvent, EventWrite } from "../domain"

export const missing = () => err(appError("not_found", "That event is not here"))
export const linked = (link: EventWrite["link"]) =>
  link ? { ...link, label: link.id, ideaId: null } : null

/** The list_calendar row for a stored event, as `me` sees it. */
export function entryOf(event: CalendarEvent, me: string): CalendarEntry {
  const myRsvp = event.attendees.find((a) => a.userId === me)?.rsvp ?? null
  const kind = event.repeatsYearly ? "occasion" : "event"
  const ideaId = event.link?.kind === "idea" ? event.link.id : null
  return {
    kind,
    id: event.id,
    title: event.title,
    timing: event.timing,
    ideaId,
    status: null,
    myRsvp,
  }
}
