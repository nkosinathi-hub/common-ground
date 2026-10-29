import { ideaTables } from "./idea-data"
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

const IDEA = "A weekend in the Cederberg"
const dueDay = { all_day: true, starts_at: null, ends_at: null, my_rsvp: null, place: null }

/** list_calendar rows: the two events, then what is due today with its idea. */
export const calendarRows = [
  ...events.map((event) => ({
    ...event,
    kind: "event",
    status: null,
    my_rsvp: "going",
    place: event.location,
    people: [ANA, BEN],
    priority: null,
    milestone_title: null,
    idea_title: null,
  })),
  ...ideaTables.tasks.map((task) => ({
    ...dueDay,
    kind: "task",
    id: task.id,
    title: task.title,
    start_date: task.due_date,
    end_date: task.due_date,
    idea_id: task.idea_id,
    status: task.status,
    people: [task.assignee_id],
    priority: task.priority,
    milestone_title: ideaTables.milestones[0]!.title,
    idea_title: IDEA,
  })),
  ...ideaTables.milestones.map((milestone) => ({
    ...dueDay,
    kind: "milestone",
    id: milestone.id,
    title: milestone.title,
    start_date: milestone.target_date,
    end_date: milestone.target_date,
    idea_id: milestone.idea_id,
    status: "open",
    people: [],
    priority: null,
    milestone_title: null,
    idea_title: IDEA,
  })),
]
