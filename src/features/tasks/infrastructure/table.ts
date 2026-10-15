import { appError, err, ok, type Result } from "@/shared/domain"
import { settle, type QueryReply } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"

type Row = Record<string, unknown>

// Feature tables enter the generated Database type only after `pnpm db:types`; query them by name.
export const table = (db: Db, name: string) =>
  (db as unknown as { from: (t: string) => ReturnType<Db["from"]> }).from(name)

export const one = <T>(query: PromiseLike<QueryReply>, map: (row: Row) => T): Promise<Result<T>> =>
  settle(query, (data) => map(data as Row))

export const many = <T>(
  query: PromiseLike<QueryReply>,
  map: (row: Row) => T,
): Promise<Result<T[]>> => settle(query, (data) => (data as Row[]).map(map))

export const STALE = "Someone else changed this. Reload to see their version"

/** An update filtered on the updated_at the client saw: zero rows back means it went stale. */
export async function guarded<T>(
  query: PromiseLike<QueryReply>,
  map: (row: Row) => T,
): Promise<Result<T>> {
  const rows = await many(query, map)
  if (!rows.ok) return rows
  const [first] = rows.value
  return first === undefined ? err(appError("conflict", STALE)) : ok(first)
}
