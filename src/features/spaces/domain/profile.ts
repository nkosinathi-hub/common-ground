import { appError, err, ok, type Result } from "@/shared/domain"
import { normaliseHex } from "./color"

const TAGLINE_MAX = 120
const PROFILE_DESCRIPTION_MAX = 1000

/** Lucide icon keys a space may use; ui/icons.ts maps each to its component. */
export const SPACE_ICONS = [
  "heart",
  "users",
  "house",
  "sparkles",
  "film",
  "popcorn",
  "coffee",
  "leaf",
  "tree-pine",
  "sun",
  "moon",
  "star",
  "music",
  "book-open",
  "palette",
  "mountain",
  "plane",
  "tent",
  "gamepad-2",
  "dog",
  "cat",
  "flower-2",
] as const
export type SpaceIcon = (typeof SPACE_ICONS)[number]

const CONTROL = /\p{Cc}/u

export function validateTagline(raw: string): Result<string> {
  const value = raw.trim()
  return value.length <= TAGLINE_MAX && !CONTROL.test(value)
    ? ok(value)
    : err(appError("validation", `Keep the tagline to one line of ${TAGLINE_MAX}`, "tagline"))
}

export function validateDescription(raw: string): Result<string> {
  const value = raw.trim()
  return value.length <= PROFILE_DESCRIPTION_MAX
    ? ok(value)
    : err(
        appError(
          "validation",
          `Keep it under ${PROFILE_DESCRIPTION_MAX} characters`,
          "description",
        ),
      )
}

export const isSpaceIcon = (raw: string | null | undefined): raw is SpaceIcon =>
  SPACE_ICONS.some((icon) => icon === raw)

export function validateIcon(raw: string | null): Result<SpaceIcon | null> {
  if (raw === null) return ok(null)
  return isSpaceIcon(raw) ? ok(raw) : err(appError("validation", "Pick one of the icons", "icon"))
}

export function validateAccent(raw: string | null): Result<string | null> {
  if (raw === null) return ok(null)
  const hex = normaliseHex(raw)
  return hex ? ok(hex) : err(appError("validation", "Use a colour like #8a4f5d", "accent"))
}
