/** The composer's tabs (S06), and which one holds each field a save can refuse. */
export type EventTab = "details" | "when" | "people"

export const EVENT_TABS: readonly { value: EventTab; label: string }[] = [
  { value: "details", label: "Details" },
  { value: "when", label: "When" },
  { value: "people", label: "People" },
]

const WHEN = ["startDate", "startTime", "endDate", "endTime", "timeZone", "repeatsYearly"]
const PEOPLE = ["attendees", "link"]

/** The tab to show for a refused field, so the message is never hidden on another tab. */
export function tabOf(field: string | null | undefined): EventTab {
  if (field && WHEN.includes(field)) return "when"
  if (field && PEOPLE.includes(field)) return "people"
  return "details"
}
