import { ANA, BEN, SPACE, demoId, now, today } from "./identity"

export const events = ["Pick a film together", "Plan the Cederberg trip"].map((title, i) => ({
  id: demoId(40 + i),
  space_id: SPACE,
  title,
  description: "A little time for us.",
  location: "At home",
  all_day: false,
  starts_at: `${today}T${i ? "19" : "18"}:30:00Z`,
  ends_at: `${today}T${i ? "20" : "19"}:30:00Z`,
  start_date: null,
  end_date: null,
  time_zone: "Africa/Johannesburg",
  repeats_yearly: false,
  watch_item_id: null,
  idea_id: null,
  task_id: null,
  default_reminders: [30],
  created_by: ANA,
  created_at: now,
  calendar_event_attendees: [ANA, BEN].map((user_id) => ({ user_id, rsvp: "going" })),
  calendar_event_reminders: [{ minutes_before: 30 }],
}))

export const calendarRows = events.map((event) => ({
  ...event,
  kind: "event",
  status: null,
  my_rsvp: "going",
}))
