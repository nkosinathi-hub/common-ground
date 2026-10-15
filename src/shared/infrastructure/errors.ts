import { appError, type AppError } from "@/shared/domain"

interface PostgrestLike {
  readonly code?: string
  readonly message?: string
  readonly status?: number
}

const BY_CODE: Record<string, AppError["kind"]> = {
  "42501": "denied",
  "28000": "unauthenticated",
  "23505": "conflict",
  "40001": "conflict",
  "23514": "validation",
  "22023": "validation",
  P0001: "validation",
  P0002: "not_found",
  PGRST116: "not_found",
}

/** Maps a Supabase/PostgREST error to a user-safe AppError without leaking internals. */
export function toAppError(error: PostgrestLike | null | undefined): AppError {
  if (!error) return appError("unknown", "Something went wrong")
  const kind = (error.code && BY_CODE[error.code]) || byStatus(error.status)
  const message = kind === "validation" && error.message ? error.message : COPY[kind]
  return appError(kind, message)
}

function byStatus(status?: number): AppError["kind"] {
  if (status === 401) return "unauthenticated"
  if (status === 403) return "denied"
  if (status === 404) return "not_found"
  if (status === 409) return "conflict"
  if (status === 429) return "rate_limited"
  if (status === 0 || status === undefined) return "network"
  return "unknown"
}

const COPY: Record<AppError["kind"], string> = {
  validation: "Please check the highlighted fields",
  denied: "You do not have access to that",
  not_found: "That is no longer available",
  conflict: "Someone else changed this first. Reload to see their version",
  rate_limited: "Too many requests. Try again in a minute",
  network: "Could not reach the server. Check your connection and retry",
  unauthenticated: "Please sign in again",
  unknown: "Something went wrong. Try again",
}
