import {
  appError,
  compareDateOnly,
  type DateOnly,
  err,
  isDateOnly,
  ok,
  type Result,
  TITLE_MAX,
} from "@/shared/domain"
import type { ProgressInput, SessionInput, TitleDetailsInput } from "./types"

/** Same bounds as the watch_items, watch_progress and watch_sessions check constraints. */
export const SYNOPSIS_MAX = 2000
export const NOTE_MAX = 500
export const YEAR_DIGITS = 4
const FIRST_FILM_YEAR = 1870
const LAST_YEAR = 2100

const fail = (message: string, field: string) => err(appError("validation", message, field))

export function validateDetails(input: TitleDetailsInput): Result<TitleDetailsInput> {
  const title = input.title.trim()
  const synopsis = input.synopsis.trim()
  const note = input.availabilityNote?.trim() || null
  if (title.length < 1 || title.length > TITLE_MAX)
    return fail(`Give the title a name (up to ${TITLE_MAX} characters)`, "title")
  const year = input.releaseYear
  if (year !== null && (!Number.isInteger(year) || year < FIRST_FILM_YEAR || year > LAST_YEAR))
    return fail(`Use a year between ${FIRST_FILM_YEAR} and ${LAST_YEAR}`, "releaseYear")
  if (synopsis.length > SYNOPSIS_MAX)
    return fail(`Keep the synopsis under ${SYNOPSIS_MAX} characters`, "synopsis")
  if (note && note.length > NOTE_MAX)
    return fail(`Keep the note under ${NOTE_MAX} characters`, "availabilityNote")
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
  if (note.length > NOTE_MAX) return fail(`Keep the note under ${NOTE_MAX} characters`, "note")
  return ok({ watchedOn: input.watchedOn, memberIds, note })
}
