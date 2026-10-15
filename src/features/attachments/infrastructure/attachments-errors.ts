import { appError, type AppError, type AppErrorKind } from "@/shared/domain"

interface ErrorBody {
  readonly kind?: unknown
  readonly message?: unknown
}

const UNAVAILABLE = "Attachments are unavailable right now. Try again in a moment"

/** The Edge Function's error kinds; its "unavailable" is a network problem for the SPA. */
const KINDS: Record<string, AppErrorKind> = {
  validation: "validation",
  unauthenticated: "unauthenticated",
  denied: "denied",
  not_found: "not_found",
  rate_limited: "rate_limited",
  unavailable: "network",
}

const COPY: Partial<Record<AppErrorKind, string>> = {
  unauthenticated: "Please sign in again",
  denied: "You do not have access to this file",
  not_found: "This file could not be found",
  network: UNAVAILABLE,
}

/** The `{ error }` body of a FunctionsHttpError, or null for transport failures. */
async function bodyOf(error: unknown): Promise<ErrorBody | null> {
  const failure = (error ?? {}) as { name?: string; context?: { json?: () => Promise<unknown> } }
  if (failure.name !== "FunctionsHttpError" || !failure.context?.json) return null
  try {
    const body = (await failure.context.json()) as { error?: ErrorBody } | null
    return body?.error ?? null
  } catch {
    return null
  }
}

/**
 * Maps a functions.invoke error to an AppError without leaking internal messages. Validation
 * and rate-limit messages are the function's own user copy, so they pass through.
 */
export async function toAttachmentsError(error: unknown): Promise<AppError> {
  const body = await bodyOf(error)
  if (!body) return appError("network", UNAVAILABLE)
  const kind = (typeof body.kind === "string" && KINDS[body.kind]) || "unknown"
  const ownCopy = kind === "validation" || kind === "rate_limited"
  if (ownCopy && typeof body.message === "string") return appError(kind, body.message)
  return appError(kind, COPY[kind] ?? "Something went wrong. Try again")
}
