import type { DateOnly } from "@/shared/domain"
import type { Database } from "@/shared/infrastructure/database.types"
import type {
  CalendarEntry,
  CalendarEvent,
  EntryKind,
  EventLink,
  EventTiming,
  EventWrite,
} from "../domain"
import type { EventRow } from "./event-row"

export { EVENT_COLUMNS, type EventRow } from "./event-row"

export type ListRow = Database["public"]["Functions"]["list_calendar"]["Returns"][number]

type Dated = Pick<ListRow, "all_day" | "starts_at" | "ends_at" | "start_date" | "end_date">

function timingOf(row: Dated): EventTiming {
  return row.all_day
    ? { allDay: true, startDate: row.start_date as DateOnly, endDate: row.end_date as DateOnly }
    : { allDay: false, startsAt: row.starts_at, endsAt: row.ends_at }
}

export const toEntry = (row: ListRow): CalendarEntry => ({
  kind: row.kind as EntryKind,
  id: row.id,
  title: row.title,
  timing: timingOf(row),
  ideaId: row.idea_id ?? null,
  status: row.status ?? null,
  myRsvp: row.my_rsvp ?? null,
  place: row.place ?? "",
  people: row.people ?? [],
  priority: row.priority ?? null,
  milestone: row.milestone_title ?? null,
  ideaTitle: row.idea_title ?? null,
})

function linkOf(row: EventRow): EventLink | null {
  if (row.watch_item_id)
    return {
      kind: "watch_item",
      id: row.watch_item_id,
      label: row.watch_items?.title ?? "",
      ideaId: null,
    }
  if (row.idea_id)
    return { kind: "idea", id: row.idea_id, label: row.ideas?.title ?? "", ideaId: row.idea_id }
  if (row.task_id)
    return {
      kind: "task",
      id: row.task_id,
      label: row.tasks?.title ?? "",
      ideaId: row.tasks?.idea_id ?? null,
    }
  return null
}

export const toEvent = (row: EventRow): CalendarEvent => ({
  id: row.id,
  spaceId: row.space_id,
  title: row.title,
  description: row.description,
  location: row.location,
  timeZone: row.time_zone,
  timing: timingOf(row as unknown as Dated),
  repeatsYearly: row.repeats_yearly,
  link: linkOf(row),
  defaultReminders: row.default_reminders,
  createdBy: row.created_by,
  attendees: row.calendar_event_attendees.map((a) => ({ userId: a.user_id, rsvp: a.rsvp })),
  myReminders: row.calendar_event_reminders.map((r) => r.minutes_before).sort((a, b) => a - b),
})

/** The writable columns for an event; the other link columns are cleared. */
export function writeRow(event: EventWrite) {
  const { timing, link } = event
  return {
    title: event.title,
    description: event.description,
    location: event.location,
    time_zone: event.timeZone,
    repeats_yearly: event.repeatsYearly,
    all_day: timing.allDay,
    starts_at: timing.allDay ? null : timing.startsAt,
    ends_at: timing.allDay ? null : timing.endsAt,
    start_date: timing.allDay ? timing.startDate : null,
    end_date: timing.allDay ? timing.endDate : null,
    watch_item_id: link?.kind === "watch_item" ? link.id : null,
    idea_id: link?.kind === "idea" ? link.id : null,
    task_id: link?.kind === "task" ? link.id : null,
    default_reminders: [...event.reminders],
  }
}
