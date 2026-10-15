import { appError, err, ok, type Result } from "@/shared/domain"

export const MIN_PASSWORD = 10

export interface SignUpInput {
  readonly email: string
  readonly password: string
  readonly displayName: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(email: string): Result<string> {
  const trimmed = email.trim().toLowerCase()
  return EMAIL.test(trimmed) && trimmed.length <= 254
    ? ok(trimmed)
    : err(appError("validation", "Enter a valid email address", "email"))
}

export function validatePassword(password: string): Result<string> {
  if (password.length < MIN_PASSWORD)
    return err(appError("validation", `Use at least ${MIN_PASSWORD} characters`, "password"))
  if (password.length > 128)
    return err(appError("validation", "Use at most 128 characters", "password"))
  return ok(password)
}

export function validateDisplayName(name: string): Result<string> {
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= 80
    ? ok(trimmed)
    : err(appError("validation", "Enter a name up to 80 characters", "displayName"))
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
