import {
  appError,
  compareDateOnly,
  err,
  isDateOnly,
  ok,
  type DateOnly,
  type Result,
} from "@/shared/domain"
import type { ProgressInput, SessionInput, TitleDetailsInput } from "./types"

const fail = (message: string, field: string) => err(appError("validation", message, field))

/** Same bounds as the watch_items check constraints. */
export function validateDetails(input: TitleDetailsInput): Result<TitleDetailsInput> {
  const title = input.title.trim()
  const synopsis = input.synopsis.trim()
  const note = input.availabilityNote?.trim() || null
  if (title.length < 1 || title.length > 200)
    return fail("Give the title a name (up to 200 characters)", "title")
  const year = input.releaseYear
  if (year !== null && (!Number.isInteger(year) || year < 1870 || year > 2100))
    return fail("Use a year between 1870 and 2100", "releaseYear")
  if (synopsis.length > 2000) return fail("Keep the synopsis under 2000 characters", "synopsis")
  if (note && note.length > 500)
    return fail("Keep the note under 500 characters", "availabilityNote")
  return ok({
    title,
    mediaType: input.mediaType,
    releaseYear: year,
    synopsis,
    availabilityNote: note,
  })
}

export function parseYear(raw: string): Result<number | null> {
  const text = raw.trim()
  if (text === "") return ok(null)
  return /^\d{4}$/.test(text) ? ok(Number(text)) : fail("Use a four digit year", "releaseYear")
}

export function parseCount(raw: string, field: "season" | "episode"): Result<number | null> {
  const text = raw.trim()
  if (text === "") return ok(null)
  return /^\d{1,5}$/.test(text) ? ok(Number(text)) : fail("Use a whole number from 0", field)
}

const isCount = (n: number | null) => n === null || (Number.isInteger(n) && n >= 0)

export function validateProgress(input: ProgressInput): Result<ProgressInput> {
  if (!isCount(input.season)) return fail("Use a whole number from 0", "season")
  if (!isCount(input.episode)) return fail("Use a whole number from 0", "episode")
  const r = input.rating
  if (r !== null && (!Number.isInteger(r) || r < 1 || r > 5))
    return fail("Rate from 1 to 5", "rating")
  const completedOn = input.status === "completed" ? input.completedOn : null
  if (completedOn !== null && !isDateOnly(completedOn))
    return fail("Use a date like 2026-10-15", "completedOn")
  return ok({ ...input, completedOn })
}

export function validateSession(input: SessionInput, today: DateOnly): Result<SessionInput> {
  if (!isDateOnly(input.watchedOn) || compareDateOnly(input.watchedOn, today) > 0)
    return fail("Choose the day you watched it", "watchedOn")
  const memberIds = [...new Set(input.memberIds)]
  if (memberIds.length === 0) return fail("Choose who was there", "memberIds")
  const note = input.note.trim()
  if (note.length > 500) return fail("Keep the note under 500 characters", "note")
  return ok({ watchedOn: input.watchedOn, memberIds, note })
}
