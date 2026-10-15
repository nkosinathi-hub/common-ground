import { appError, err, ok, type Result } from "@/shared/domain"
import { toAppError } from "./errors"

export interface QueryReply {
  readonly data: unknown
  readonly error: {
    readonly code?: string
    readonly message?: string
    readonly status?: number
  } | null
}

/** Awaits a PostgREST query and maps its data, or its error to an AppError. */
export async function settle<T>(
  query: PromiseLike<QueryReply>,
  map: (data: unknown) => T,
): Promise<Result<T>> {
  const { data, error } = await query
  return error ? err(toAppError(error)) : ok(map(data))
}

/**
 * Awaits a delete that selected the deleted ids. RLS refuses deletes silently (zero rows), so an
 * empty result means the caller may not delete it: only its author or the space owner can.
 */
export async function removed(query: PromiseLike<QueryReply>): Promise<Result<void>> {
  const { data, error } = await query
  if (error) return err(toAppError(error))
  if (!Array.isArray(data) || data.length === 0) {
    return err(appError("denied", "Only its author or the space owner can delete this"))
  }
  return ok(undefined)
}
