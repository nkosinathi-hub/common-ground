import { appError, type AppError, type AppErrorKind } from "@/shared/domain"

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
  network: "Attachments are unavailable right now. Try again in a moment",
}

interface FunctionsErrorLike {
  readonly name?: string
  readonly context?: { json?: () => Promise<unknown> }
}

async function bodyOf(error: FunctionsErrorLike) {
  if (error.name !== "FunctionsHttpError" || typeof error.context?.json !== "function") return null
  try {
    const body = (await error.context.json()) as { error?: { kind?: unknown; message?: unknown } }
    return body?.error ?? null
  } catch {
    return null
  }
}

/**
 * Maps a functions.invoke error to an AppError. Validation and rate-limit messages are the
 * function's own user copy (for example why a file was rejected), so they pass through.
 */
export async function toAttachmentsError(error: unknown): Promise<AppError> {
  const body = await bodyOf((error ?? {}) as FunctionsErrorLike)
  const kind = typeof body?.kind === "string" ? (KINDS[body.kind] ?? "unknown") : "network"
  const passThrough = kind === "validation" || kind === "rate_limited"
  if (passThrough && typeof body?.message === "string") return appError(kind, body.message)
  return appError(kind, COPY[kind] ?? "Something went wrong. Try again")
}
