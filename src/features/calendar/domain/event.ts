import {
  appError,
  type DateOnly,
  err,
  isDateOnly,
  ok,
  type Result,
  TITLE_MAX,
} from "@/shared/domain"
import { addDays, daysBetween } from "./days"
import type { EventDraft, EventTiming, EventWrite } from "./types"
import { isTimeZone, toInstant } from "./zone"

export type * from "./types"

export const LOCATION_MAX = 300
export const DESCRIPTION_MAX = 4000
export const ALL_DAY_SPAN_MAX = 30
const TIMED_MS_MAX = 14 * 86_400_000
/** Minutes before the start a reminder may be set; the database allows these only. */
export const REMINDER_MINUTES = [0, 5, 10, 15, 30, 60, 120, 1440, 2880, 10080] as const
export const REMINDERS_MAX = 3

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const invalid = (field: string, message: string) => err(appError("validation", message, field))

function checkTiming(draft: EventDraft): Result<EventTiming> {
  if (!isDateOnly(draft.startDate)) return invalid("startDate", "Choose a start date")
  if (!isDateOnly(draft.endDate)) return invalid("endDate", "Choose an end date")
  const [startDate, endDate] = [draft.startDate, draft.endDate]
  if (draft.allDay) {
    const span = daysBetween(startDate, endDate)
    if (span < 0) return invalid("endDate", "End on or after the start date")
    if (span > ALL_DAY_SPAN_MAX) return invalid("endDate", "An event can last up to 31 days")
    return ok({ allDay: true, startDate, endDate })
  }
  if (!TIME.test(draft.startTime)) return invalid("startTime", "Choose a start time")
  if (!TIME.test(draft.endTime)) return invalid("endTime", "Choose an end time")
  const startsAt = toInstant(startDate, draft.startTime, draft.timeZone)
  const endsAt = toInstant(endDate, draft.endTime, draft.timeZone)
  const length = Date.parse(endsAt) - Date.parse(startsAt)
  if (length < 0) return invalid("endTime", "End after the start")
  if (length > TIMED_MS_MAX) return invalid("endTime", "A timed event can last up to 14 days")
  return ok({ allDay: false, startsAt, endsAt })
}

function checkText(draft: EventDraft): Result<Pick<EventWrite, "title">> {
  const title = draft.title.trim()
  if (title.length < 1 || title.length > TITLE_MAX)
    return invalid("title", `Give the event a title of up to ${TITLE_MAX} characters`)
  if (draft.location.length > LOCATION_MAX)
    return invalid("location", `Keep the place to ${LOCATION_MAX} characters`)
  if (draft.description.length > DESCRIPTION_MAX)
    return invalid("description", `Keep the details to ${DESCRIPTION_MAX} characters`)
  return ok({ title })
}

function checkReminders(minutes: readonly number[]): Result<number[]> {
  const unique = [...new Set(minutes)]
  const offered = (m: number) => (REMINDER_MINUTES as readonly number[]).includes(m)
  if (unique.length > REMINDERS_MAX || !unique.every(offered))
    return invalid("reminders", "Choose up to three of the offered reminders")
  return ok(unique)
}

/** Checks a draft and resolves its wall-clock times to instants in the event's zone. */
export function validateEvent(draft: EventDraft): Result<EventWrite> {
  const text = checkText(draft)
  if (!text.ok) return text
  if (!isTimeZone(draft.timeZone)) return invalid("timeZone", "Choose a time zone from the list")
  const timing = checkTiming(draft)
  if (!timing.ok) return timing
  const oneDay = timing.value.allDay && timing.value.startDate === timing.value.endDate
  if (draft.repeatsYearly && !oneDay)
    return invalid("repeatsYearly", "Only one-day, all-day events can repeat every year")
  const reminders = checkReminders(draft.reminders)
  if (!reminders.ok) return reminders
  return ok({
    title: text.value.title,
    description: draft.description,
    location: draft.location.trim(),
    timeZone: draft.timeZone,
    timing: timing.value,
    repeatsYearly: draft.repeatsYearly,
    link: draft.link,
    reminders: reminders.value,
  })
}

/** The last day an all-day event covers, plus one: the exclusive end used by .ics files. */
export const dayAfter = (day: DateOnly) => addDays(day, 1)
