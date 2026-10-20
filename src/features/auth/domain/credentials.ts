import { appError, err, MIN_PASSWORD, ok, validateDisplayName, type Result } from "@/shared/domain"

export interface SignUpInput {
  readonly email: string
  readonly password: string
  readonly displayName: string
}

const PASSWORD_MAX = 128
/** RFC 5321 limit on a forward path. */
const EMAIL_MAX = 254

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(email: string): Result<string> {
  const trimmed = email.trim().toLowerCase()
  return EMAIL.test(trimmed) && trimmed.length <= EMAIL_MAX
    ? ok(trimmed)
    : err(appError("validation", "Enter a valid email address", "email"))
}

export function validatePassword(password: string): Result<string> {
  if (password.length < MIN_PASSWORD)
    return err(appError("validation", `Use at least ${MIN_PASSWORD} characters`, "password"))
  if (password.length > PASSWORD_MAX)
    return err(appError("validation", `Use at most ${PASSWORD_MAX} characters`, "password"))
  return ok(password)
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
