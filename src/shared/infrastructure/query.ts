import { appError, err, ok, type AppError, type Result } from "@/shared/domain"
import { toAppError } from "./errors"

export interface QueryError {
  readonly code?: string
  readonly message?: string
  readonly status?: number
}

export interface QueryReply<D = unknown> {
  readonly data: D | null
  readonly error: QueryError | null
}

/** Awaits a typed PostgREST query or RPC and maps its data, or its error to an AppError. */
export async function settle<D, T>(
  query: PromiseLike<QueryReply<D>>,
  map: (data: D) => T,
): Promise<Result<T>> {
  const { data, error } = await query
  return error ? err(toAppError(error)) : ok(map(data as D))
}

/** The identity map, for settle calls whose data is already the value. */
export const same = <T>(data: T): T => data

/** Awaits a write whose result is not needed. */
export async function done(
  query: PromiseLike<{ readonly error: QueryError | null }>,
): Promise<Result<void>> {
  const { error } = await query
  return error ? err(toAppError(error)) : ok(undefined)
}

/**
 * Awaits a delete that selected the deleted ids. RLS refuses deletes silently (zero rows), so an
 * empty result means the caller may not delete it: only its author or the space owner can.
 */
export async function removed(query: PromiseLike<QueryReply<unknown>>): Promise<Result<void>> {
  const { data, error } = await query
  if (error) return err(toAppError(error))
  if (!Array.isArray(data) || data.length === 0) {
    return err(appError("denied", "Only its author or the space owner can delete this"))
  }
  return ok(undefined)
}

/**
 * Awaits an update that selected the ids it touched. RLS hides rows it refuses to update, so no
 * row back means the caller could not find it, reported as `gone`.
 */
export async function touched(
  query: PromiseLike<QueryReply<readonly unknown[]>>,
  gone: AppError,
): Promise<Result<void>> {
  const { data, error } = await query
  if (error) return err(toAppError(error))
  return data && data.length > 0 ? ok(undefined) : err(gone)
}

const STALE = "Someone else changed this. Reload to see their version"

/**
 * Awaits an update matched on the updated_at the client saw, selecting the row back: no row back
 * means someone else changed it first, so the update went stale.
 */
export async function current<R, T>(
  query: PromiseLike<QueryReply<R[]>>,
  map: (row: R) => T,
): Promise<Result<T>> {
  const { data, error } = await query
  if (error) return err(toAppError(error))
  const [row] = data ?? []
  return row ? ok(map(row)) : err(appError("conflict", STALE))
}

/** Signed-out callers never send an empty string where Postgres expects a uuid. */
export const signedOut = () => err(appError("unauthenticated", "Please sign in again"))
