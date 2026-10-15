import { nextCursor, PAGE_SIZE, type Cursor, type Page, type Result } from "@/shared/domain"
import { olderThan } from "@/shared/infrastructure/paging"
import { removed, settle, type QueryReply } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { ChildCollection } from "../application/ports"

type Row = Record<string, unknown>

export interface ChildTable<T, Input> {
  readonly table: string
  readonly columns: string
  readonly toModel: (row: Row) => T
  readonly toRow: (input: Input) => Row
}

export const single = <T>(
  query: PromiseLike<QueryReply>,
  map: (row: Row) => T,
): Promise<Result<T>> => settle(query, (data) => map(data as Row))

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

  list(ideaId: string, after: Cursor | null): Promise<Result<Page<T>>> {
    let query = this.from().select(this.spec.columns).eq("idea_id", ideaId)
    if (after) query = query.or(olderThan(after))
    const page = query.order("created_at", { ascending: false }).order("id", { ascending: false })
    return settle(page.limit(PAGE_SIZE), (data) => {
      const items = (data as Row[]).map(this.spec.toModel)
      return { items, next: nextCursor(items) }
    })
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
    return removed(this.from().delete().eq("id", id).select("id"))
  }
}
