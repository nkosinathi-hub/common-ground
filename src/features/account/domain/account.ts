import { appError, err, ok, todayDateOnly, type Result } from "@/shared/domain"

export const CONFIRM_WORD = "DELETE"
export const DISPLAY_NAME_MAX = 80
/** The auth service refuses shorter passwords; the account page states the same floor. */
export const MIN_PASSWORD = 10

const slug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

/** Download name for an export, e.g. `common-ground-our-trip-2026-10-15.json`. */
export function exportFilename(spaceName: string, date: Date): string {
  return `common-ground-${slug(spaceName) || "space"}-${todayDateOnly(date)}.json`
}

export function validateConfirmation(value: string): Result<void> {
  return value === CONFIRM_WORD
    ? ok(undefined)
    : err(appError("validation", `Type ${CONFIRM_WORD} to confirm`, "confirmation"))
}

export function validateDisplayName(name: string): Result<string> {
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= DISPLAY_NAME_MAX
    ? ok(trimmed)
    : err(appError("validation", `Use 1 to ${DISPLAY_NAME_MAX} characters`, "displayName"))
}
