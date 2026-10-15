import { appError, err, ok, type Result } from "@/shared/domain"

export interface SignUpInput {
  readonly email: string
  readonly password: string
  readonly displayName: string
}

export const MIN_PASSWORD = 10
export const MAX_PASSWORD = 128
/** RFC 5321 limit on a forward path. */
export const MAX_EMAIL = 254
export const MAX_DISPLAY_NAME = 80

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(email: string): Result<string> {
  const trimmed = email.trim().toLowerCase()
  return EMAIL.test(trimmed) && trimmed.length <= MAX_EMAIL
    ? ok(trimmed)
    : err(appError("validation", "Enter a valid email address", "email"))
}

export function validatePassword(password: string): Result<string> {
  if (password.length < MIN_PASSWORD)
    return err(appError("validation", `Use at least ${MIN_PASSWORD} characters`, "password"))
  if (password.length > MAX_PASSWORD)
    return err(appError("validation", `Use at most ${MAX_PASSWORD} characters`, "password"))
  return ok(password)
}

export function validateDisplayName(name: string): Result<string> {
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= MAX_DISPLAY_NAME
    ? ok(trimmed)
    : err(
        appError("validation", `Enter a name up to ${MAX_DISPLAY_NAME} characters`, "displayName"),
      )
}

export function validateSignUp(input: SignUpInput): Result<SignUpInput> {
  const email = validateEmail(input.email)
  if (!email.ok) return email
  const password = validatePassword(input.password)
  if (!password.ok) return password
  const displayName = validateDisplayName(input.displayName)
  if (!displayName.ok) return displayName
  return ok({ email: email.value, password: password.value, displayName: displayName.value })
}
