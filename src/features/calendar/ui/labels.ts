import type { RsvpAnswer } from "../domain"

const UNITS: [number, string][] = [
  [10080, "week"],
  [1440, "day"],
  [60, "hour"],
  [1, "minute"],
]

/** "1 hour before", "2 days before"; 0 is the start itself. */
export function reminderLabel(minutes: number): string {
  if (minutes === 0) return "At the start"
  const [size, unit] = UNITS.find(([size]) => minutes % size === 0)!
  const count = minutes / size
  return `${count} ${unit}${count === 1 ? "" : "s"} before`
}

/** The reminder choice offered in the event form and for my own reminders. */
export const REMINDER_OPTIONS = [
  { value: "none", label: "No reminder" },
  ...[0, 10, 60, 1440].map((m) => ({ value: String(m), label: reminderLabel(m) })),
]

export const RSVP_LABELS: Record<RsvpAnswer, string> = {
  going: "Going",
  maybe: "Maybe",
  declined: "Can't go",
}
