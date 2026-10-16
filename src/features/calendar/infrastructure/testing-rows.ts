import type { EventWrite } from "../domain"

/** Rows as PostgREST returns them, for the adapter tests. */
export const listRow = (patch: Record<string, unknown> = {}) => ({
  kind: "event",
  id: "e1",
  title: "Movie night",
  all_day: false,
  starts_at: "2026-10-16T06:00:00+00:00",
  ends_at: "2026-10-16T08:00:00+00:00",
  start_date: null,
  end_date: null,
  idea_id: "i1",
  status: null,
  my_rsvp: "going",
  ...patch,
})

export const eventRow = (patch: Record<string, unknown> = {}) => ({
  id: "e1",
  space_id: "s1",
  title: "Movie night",
  description: "",
  location: "Lounge",
  all_day: false,
  starts_at: "2026-10-16T06:00:00+00:00",
  ends_at: "2026-10-16T08:00:00+00:00",
  start_date: null,
  end_date: null,
  time_zone: "Pacific/Auckland",
  repeats_yearly: false,
  watch_item_id: null,
  idea_id: null,
  task_id: "t1",
  default_reminders: [60],
  created_by: "u1",
  watch_items: null,
  ideas: null,
  tasks: { title: "Book the stall", idea_id: "i1" },
  calendar_event_attendees: [{ user_id: "u1", rsvp: "going" }],
  calendar_event_reminders: [{ minutes_before: 60 }],
  ...patch,
})

export const write: EventWrite = {
  title: "Movie night",
  description: "",
  location: "",
  timeZone: "Pacific/Auckland",
  timing: {
    allDay: false,
    startsAt: "2026-10-16T06:00:00.000Z",
    endsAt: "2026-10-16T08:00:00.000Z",
  },
  repeatsYearly: false,
  link: { kind: "idea", id: "i1" },
  reminders: [60],
}
