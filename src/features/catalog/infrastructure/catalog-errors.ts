import { appError, type AppError, type AppErrorKind } from "@/shared/domain"

export const OUTAGE_MESSAGE =
  "The catalog is unavailable right now. Your search is kept: try again, or add the title manually."

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
  denied: "You do not have access to this space",
  not_found: "This catalog title could not be found",
  rate_limited: "The catalog is busy. Give it a minute, then try again",
  network: OUTAGE_MESSAGE,
}

interface FunctionsErrorLike {
  readonly name?: string
  readonly context?: { json?: () => Promise<unknown> }
}

async function bodyOf(
  error: FunctionsErrorLike,
): Promise<{ kind?: unknown; message?: unknown } | null> {
  if (error.name !== "FunctionsHttpError" || typeof error.context?.json !== "function") return null
  try {
    const body = (await error.context.json()) as { error?: { kind?: unknown; message?: unknown } }
    return body?.error ?? null
  } catch {
    return null
  }
}

/** Maps a functions.invoke error to an AppError; unknown or transport failures read as an outage. */
export async function toCatalogError(error: unknown): Promise<AppError> {
  const body = await bodyOf((error ?? {}) as FunctionsErrorLike)
  const kind = typeof body?.kind === "string" ? (KINDS[body.kind] ?? "unknown") : "network"
  if (kind === "validation" && typeof body?.message === "string")
    return appError(kind, body.message)
  return appError(kind, COPY[kind] ?? "Something went wrong. Try again")
}
