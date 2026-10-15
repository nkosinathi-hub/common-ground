import { appError, err, ok, type Result } from "./result"

/** profiles.display_name allows 1 to 80 characters after trimming. */
export const DISPLAY_NAME_MAX = 80
/** The auth service refuses shorter passwords; sign-up, reset and the account page state it. */
export const MIN_PASSWORD = 10

export function validateDisplayName(name: string): Result<string> {
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= DISPLAY_NAME_MAX
    ? ok(trimmed)
    : err(appError("validation", `Use 1 to ${DISPLAY_NAME_MAX} characters`, "displayName"))
}
