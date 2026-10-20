import { appError, err, ok, type AppError, type AppErrorKind, type Result } from "@/shared/domain"
import type { Db } from "./supabase"

/** How the SPA words one Edge Function's failures. */
export interface FunctionCopy {
  /** Shown for transport failures and the function's own "unavailable". */
  readonly outage: string
  /** Copy per kind, so internal messages never reach the screen. */
  readonly copy: Partial<Record<AppErrorKind, string>>
  /** Kinds whose message is already the function's user copy, so it passes through. */
  readonly ownCopy: readonly AppErrorKind[]
}

const ORIGIN = "This app address is not allowed to reach the server. Check its allowed origins."

interface ErrorBody {
  readonly kind?: unknown
  readonly message?: unknown
}

/** The Edge Functions' error kinds (_shared/http/outcome.ts); "unavailable" is an outage. */
const KINDS: Record<string, AppErrorKind> = {
  validation: "validation",
  unauthenticated: "unauthenticated",
  denied: "denied",
  not_found: "not_found",
  rate_limited: "rate_limited",
  unavailable: "network",
}

/** The `{ error }` body of a FunctionsHttpError, or null for transport failures and junk. */
async function bodyOf(error: unknown): Promise<ErrorBody | null> {
  const failure = (error ?? {}) as { name?: string; context?: { json?: () => Promise<unknown> } }
  if (failure.name !== "FunctionsHttpError" || typeof failure.context?.json !== "function")
    return null
  try {
    const body = (await failure.context.json()) as { error?: ErrorBody } | null
    return body?.error ?? null
  } catch {
    return null
  }
}

/** Maps a functions.invoke error to an AppError without leaking internal messages. */
export async function toFunctionError(error: unknown, words: FunctionCopy): Promise<AppError> {
  const body = await bodyOf(error)
  if (!body) return appError("network", words.outage)
  const kind = (typeof body.kind === "string" && KINDS[body.kind]) || "unknown"
  if (words.ownCopy.includes(kind) && typeof body.message === "string")
    return appError(kind, body.message)
  if (kind === "network") return appError(kind, words.outage)
  // serve.ts refuses an origin outside ALLOWED_ORIGINS; that is setup, not a missing membership.
  if (kind === "denied" && body.message === "Origin not allowed") return appError(kind, ORIGIN)
  return appError(kind, words.copy[kind] ?? "Something went wrong. Try again")
}

/** Invokes an Edge Function with the user's JWT; any failure becomes a worded AppError. */
export async function invokeFunction<T>(
  db: Pick<Db, "functions">,
  name: string,
  body: Record<string, unknown>,
  words: FunctionCopy,
  signal?: AbortSignal,
): Promise<Result<T>> {
  try {
    const reply: { data: T | null; error: unknown } = await db.functions.invoke<T>(name, {
      body,
      signal,
    })
    const { data, error } = reply
    if (error) return err(await toFunctionError(error, words))
    return ok(data as T)
  } catch {
    return err(appError("network", words.outage))
  }
}
