import type { CalendarEvent } from "./types"
import { dayAfter } from "./event"

type IcsEvent = Pick<
  CalendarEvent,
  "id" | "title" | "description" | "location" | "repeatsYearly" | "timing"
>

/** TEXT value escaping (RFC 5545 3.3.11). */
export const icsText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")

const encoder = new TextEncoder()
const octets = (text: string) => encoder.encode(text).length

/** Folds a content line at 75 octets, never inside a character (RFC 5545 3.1). */
function fold(line: string): string {
  const parts: string[] = []
  let current = ""
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74
    if (octets(current + char) > limit) {
      parts.push(current)
      current = ""
    }
    current += char
  }
  parts.push(current)
  return parts.join("\r\n ")
}

const utc = (instant: string | Date) =>
  new Date(instant)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")
const date = (day: string) => day.replace(/-/g, "")

function when(event: IcsEvent): string[] {
  const { timing } = event
  if (!timing.allDay) return [`DTSTART:${utc(timing.startsAt)}`, `DTEND:${utc(timing.endsAt)}`]
  return [
    `DTSTART;VALUE=DATE:${date(timing.startDate)}`,
    // DTEND is exclusive for dates: the day after the last day.
    `DTEND;VALUE=DATE:${date(dayAfter(timing.endDate))}`,
    ...(event.repeatsYearly ? ["RRULE:FREQ=YEARLY"] : []),
  ]
}

/** A one-event iCalendar file. Timed events are written in UTC, all-day events as dates. */
export function eventIcs(event: IcsEvent, now: Date): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Common Ground//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@common-ground`,
    `DTSTAMP:${utc(now)}`,
    ...when(event),
    `SUMMARY:${icsText(event.title)}`,
    ...(event.location ? [`LOCATION:${icsText(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${icsText(event.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return lines.map(fold).join("\r\n") + "\r\n"
}

export function icsFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${slug || "event"}.ics`
}
