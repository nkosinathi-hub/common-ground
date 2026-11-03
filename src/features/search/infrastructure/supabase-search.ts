import { ok, type Result } from "@/shared/domain"
import { settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { SearchGateway } from "../application/search-service"
import { SEARCH_LIMIT, type SearchPage } from "../domain/search"
import { record, safeComment, toHit } from "./search-row"
import { pattern, quoted, SOURCES, type SearchSource } from "./search-sources"

/** Only existing RLS-protected tables are queried, always within the active space. */
export class SupabaseSearch implements SearchGateway {
  constructor(
    private readonly db: Db,
    private readonly viewer: () => string,
  ) {}
  private async source(
    source: SearchSource,
    spaceId: string,
    text: string,
    page: number,
    signal: AbortSignal,
  ) {
    let query = this.db.from(source.table).select(source.columns).filter("space_id", "eq", spaceId)
    const like = pattern(text)
    query =
      source.fields.length === 1
        ? query.ilike(source.fields[0]!, like)
        : query.or(source.fields.map((field) => `${field}.ilike.${quoted(like)}`).join(","))
    if (source.kind === "note")
      query = query.or(`expires_at.is.null,expires_at.gt.${quoted(new Date().toISOString())}`)
    if (source.kind === "discussion")
      query = query
        .filter("spoiler", "eq", false)
        .filter("watch_items.watch_progress.user_id", "eq", this.viewer())
    if (source.kind === "attachment") query = query.filter("status", "eq", "ready")
    const found = await settle(
      query
        .order("id")
        .range(page * SEARCH_LIMIT, (page + 1) * SEARCH_LIMIT - 1)
        .abortSignal(signal),
      (rows) => rows as unknown[],
    )
    if (!found.ok) return { hits: [], unavailable: [source.kind], more: false }
    const safe =
      source.kind === "discussion"
        ? found.value.filter((row) => safeComment(record(row), this.viewer()))
        : found.value
    return {
      hits: safe.flatMap((row) => toHit(row, source.kind, spaceId)),
      unavailable: [],
      more: found.value.length === SEARCH_LIMIT,
    }
  }
  async search(
    spaceId: string,
    text: string,
    page: number,
    signal: AbortSignal,
  ): Promise<Result<SearchPage>> {
    const settled = await Promise.allSettled(
      SOURCES.map((source) => this.source(source, spaceId, text, page, signal)),
    )
    const groups = settled.map((group, i) =>
      group.status === "fulfilled"
        ? group.value
        : { hits: [], unavailable: [SOURCES[i]!.kind], more: false },
    )
    return ok({
      hits: groups.flatMap((g) => g.hits),
      unavailable: [...new Set(groups.flatMap((g) => g.unavailable))],
      more: groups.some((g) => g.more),
    })
  }
}
