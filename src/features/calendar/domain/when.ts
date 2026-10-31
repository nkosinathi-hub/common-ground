import { LOCALE, type DateOnly } from "@/shared/domain"
import type { YearMonth } from "./days"
import type { EventTiming } from "./types"
import { localDay, localTime } from "./zone"

const dayFormat = (options: Intl.DateTimeFormatOptions, zone = "UTC") =>
  new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: zone })
const MONTH = dayFormat({ month: "long", year: "numeric" })
const LONG = dayFormat({ weekday: "long", day: "numeric", month: "long", year: "numeric" })
const SHORT = dayFormat({ weekday: "short", day: "numeric", month: "long", year: "numeric" })

// A DateOnly read at UTC noon and formatted in UTC is the same day everywhere.
const atNoonUtc = (day: DateOnly) => new Date(`${day}T12:00:00Z`)

export const monthTitle = ({ year, month }: YearMonth) =>
  MONTH.format(new Date(Date.UTC(year, month - 1, 15)))

const MONTH_NAME = dayFormat({ month: "long" })
/** "October": the month alone, for "That is everything for October". */
export const monthName = ({ year, month }: YearMonth) =>
  MONTH_NAME.format(new Date(Date.UTC(year, month - 1, 15)))

/** "Fri 5 October 2026", built from parts so ICU punctuation differences do not leak in. */
function spelled(format: Intl.DateTimeFormat, day: DateOnly, withYear: boolean): string {
  const parts = format.formatToParts(atNoonUtc(day))
  const part = (type: string) => parts.find((p) => p.type === type)!.value
  const words = [part("weekday"), part("day"), part("month")]
  return (withYear ? [...words, part("year")] : words).join(" ")
}

export const weekdayName = (day: DateOnly, width: "short" | "long") =>
  dayFormat({ weekday: width }).format(atNoonUtc(day))

export const dayHeading = (day: DateOnly) => spelled(LONG, day, false)
const fullDay = (day: DateOnly) => spelled(SHORT, day, true)

/** The month grid cell's accessible name, e.g. "Thu 16 October, 2 events". */
export function cellLabel(day: DateOnly, count: number): string {
  const name = spelled(SHORT, day, false)
  if (count === 0) return name
  return `${name}, ${count} ${count === 1 ? "event" : "events"}`
}

function timedText(startsAt: string, endsAt: string, zone: string): string {
  const [startDay, endDay] = [localDay(startsAt, zone), localDay(endsAt, zone)]
  const [from, to] = [localTime(startsAt, zone), localTime(endsAt, zone)]
  if (startDay === endDay) return `${fullDay(startDay)}, ${from} to ${to}`
  return `${fullDay(startDay)}, ${from} to ${fullDay(endDay)}, ${to}`
}

export interface WhenText {
  readonly text: string
  /** The time in the event's own zone, when the viewer is somewhere else. */
  readonly zoneNote: string | null
}

export function formatWhen(timing: EventTiming, eventZone: string, viewerZone: string): WhenText {
  if (timing.allDay) {
    const { startDate, endDate } = timing
    const text =
      startDate === endDate
        ? `${fullDay(startDate)}, all day`
        : `${fullDay(startDate)} to ${fullDay(endDate)}`
    return { text, zoneNote: null }
  }
  const text = timedText(timing.startsAt, timing.endsAt, viewerZone)
  if (eventZone === viewerZone) return { text, zoneNote: null }
  return {
    text,
    zoneNote: `${timedText(timing.startsAt, timing.endsAt, eventZone)} in ${eventZone}`,
  }
}

/** A chip's time: the local start time on the day a timed event starts, else nothing. */
export function entryTime(timing: EventTiming, day: DateOnly, zone: string): string {
  if (timing.allDay || localDay(timing.startsAt, zone) !== day) return ""
  return localTime(timing.startsAt, zone)
}
