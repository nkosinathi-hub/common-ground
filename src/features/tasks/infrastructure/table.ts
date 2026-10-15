import type { Result } from "@/shared/domain"
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
