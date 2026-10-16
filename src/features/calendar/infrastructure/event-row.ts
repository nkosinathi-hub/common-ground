import type { Database } from "@/shared/infrastructure/database.types"
import type { Rsvp } from "../domain"

type EventColumns = Database["public"]["Tables"]["calendar_events"]["Row"]

/** One event with its link's title, its attendees and the caller's own reminders (RLS). */
export const EVENT_COLUMNS =
  "id, space_id, title, description, location, all_day, starts_at, ends_at, start_date, " +
  "end_date, time_zone, repeats_yearly, watch_item_id, idea_id, task_id, default_reminders, " +
  "created_by, watch_items(title), ideas(title), tasks(title, idea_id), " +
  "calendar_event_attendees(user_id, rsvp), calendar_event_reminders(minutes_before)"

export interface EventRow extends EventColumns {
  readonly watch_items: { title: string } | null
  readonly ideas: { title: string } | null
  readonly tasks: { title: string; idea_id: string } | null
  readonly calendar_event_attendees: { user_id: string; rsvp: Rsvp }[]
  readonly calendar_event_reminders: { minutes_before: number }[]
}
