import { err, ok, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type { Db } from "@/shared/infrastructure/supabase"

type Row = Record<string, unknown>
type Response = {
  data: unknown
  error: { code?: string; message?: string; status?: number } | null
}

// Feature tables enter the generated Database type only after `pnpm db:types`; query them by name.
export const table = (db: Db, name: string) =>
  (db as unknown as { from: (t: string) => ReturnType<Db["from"]> }).from(name)

export async function one<T>(
  query: PromiseLike<Response>,
  map: (row: Row) => T,
): Promise<Result<T>> {
  const { data, error } = await query
  return error ? err(toAppError(error)) : ok(map(data as Row))
}

export async function many<T>(
  query: PromiseLike<Response>,
  map: (row: Row) => T,
): Promise<Result<T[]>> {
  const { data, error } = await query
  return error ? err(toAppError(error)) : ok((data as Row[]).map(map))
}

export async function none(query: PromiseLike<Response>): Promise<Result<void>> {
  const { error } = await query
  return error ? err(toAppError(error)) : ok(undefined)
}
