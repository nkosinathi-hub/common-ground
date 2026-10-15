import { err, ok, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type { Db } from "@/shared/infrastructure/supabase"
import type { ChildCollection } from "../application/ports"
import { nextCursor, PAGE_SIZE, type Cursor, type Page } from "@/shared/domain"
import { afterCursor } from "./keyset"

type Row = Record<string, unknown>
type Response = {
  data: unknown
  error: { code?: string; message?: string; status?: number } | null
}

export interface ChildTable<T, Input> {
  readonly table: string
  readonly columns: string
  readonly toModel: (row: Row) => T
  readonly toRow: (input: Input) => Row
}

export const single = async <T>(
  query: PromiseLike<Response>,
  map: (row: Row) => T,
): Promise<Result<T>> => {
  const { data, error } = await query
  return error ? err(toAppError(error)) : ok(map(data as Row))
}

/** One PostgREST table keyed by idea_id, paged newest first. */
export class SupabaseChildren<T extends Cursor, Input> implements ChildCollection<T, Input> {
  constructor(
    protected readonly db: Db,
    protected readonly spec: ChildTable<T, Input>,
  ) {}

  // The generated Database type does not know every feature table on every branch.
  protected from() {
    return (this.db as unknown as { from: (t: string) => ReturnType<Db["from"]> }).from(
      this.spec.table,
    )
  }

  async list(ideaId: string, after: Cursor | null): Promise<Result<Page<T>>> {
    let query = this.from().select(this.spec.columns).eq("idea_id", ideaId)
    if (after) query = query.or(afterCursor(after))
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE)
    if (error) return err(toAppError(error))
    const items = (data as unknown as Row[]).map(this.spec.toModel)
    return ok({ items, next: nextCursor(items) })
  }

  add(spaceId: string, ideaId: string, input: Input): Promise<Result<T>> {
    const row = { space_id: spaceId, idea_id: ideaId, ...this.spec.toRow(input) }
    return single(
      this.from()
        .insert(row as never)
        .select(this.spec.columns)
        .single(),
      this.spec.toModel,
    )
  }

  async remove(id: string): Promise<Result<void>> {
    const { error } = await this.from().delete().eq("id", id)
    return error ? err(toAppError(error)) : ok(undefined)
  }
}
