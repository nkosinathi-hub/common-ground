import type { SupabaseClient } from "@supabase/supabase-js"
import { appError, err, ok, type Result } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"
import type { ListRequest, WatchGateway } from "../application/ports"
import { pageOf } from "../domain/filters"
import type * as T from "../domain/types"
import { SupabaseWatchProgress } from "./supabase-watch-progress"
import { catalogArgs, detailColumns, listArgs } from "./watch-args"
import { ITEM_COLUMNS, toItem, unwrap, type WatchItemRow } from "./watch-rows"

const GONE = appError("not_found", "That title is no longer on your list")
const NOT_YOURS = appError(
  "denied",
  "Only the person who added it or the space owner can delete it",
)
type Ids = { id: string }[]

/** Watchlist adapter. Visibility and permissions are enforced by RLS and the watch RPCs. */
export class SupabaseWatchGateway extends SupabaseWatchProgress implements WatchGateway {
  constructor(db: Db) {
    // The watch tables are newer than the generated types, so this adapter uses an untyped client.
    super(db as unknown as SupabaseClient)
  }

  async list(request: ListRequest): Promise<Result<T.WatchPage>> {
    const rows = unwrap<WatchItemRow[]>(await this.db.rpc("list_watch_items", listArgs(request)))
    if (!rows.ok) return rows
    const keyed = (rows.value ?? []).map((r) => ({ item: toItem(r), sortKey: r.sort_key ?? "" }))
    return ok(pageOf(keyed, request.size))
  }

  async get(spaceId: string, itemId: string): Promise<Result<T.WatchItemView>> {
    const [row, owner, me] = await Promise.all([
      this.db.from("watch_items").select(ITEM_COLUMNS).eq("space_id", spaceId).eq("id", itemId),
      this.db.rpc("is_space_owner", { target_space: spaceId }),
      this.me(),
    ])
    const found = unwrap<WatchItemRow[]>(row)
    if (!found.ok) return found
    const item = found.value?.[0]
    if (!item) return err(GONE)
    const mine = await this.db
      .from("watch_progress")
      .select("status")
      .eq("watch_item_id", itemId)
      .eq("user_id", me)
    const status = (mine.data?.[0] as { status?: T.ProgressStatus } | undefined)?.status
    const canDelete = owner.data === true || (me !== "" && item.created_by === me)
    return ok({ item: toItem(item, status), canDelete })
  }

  addCatalog = async (spaceId: string, pick: T.CatalogPick, intent: T.SharedIntent) =>
    unwrap<string>(await this.db.rpc("add_catalog_title", catalogArgs(spaceId, pick, intent)))

  async addManual(spaceId: string, input: T.ManualTitleInput): Promise<Result<string>> {
    const row = { space_id: spaceId, ...detailColumns(input), shared_intent: input.intent }
    const rows = unwrap<Ids>(await this.db.from("watch_items").insert(row).select("id"))
    return rows.ok ? ok(rows.value[0]?.id ?? "") : rows
  }

  updateDetails = (itemId: string, input: T.TitleDetailsInput) =>
    this.change(itemId, detailColumns(input))
  setIntent = (itemId: string, intent: T.SharedIntent) =>
    this.change(itemId, { shared_intent: intent })

  async remove(itemId: string): Promise<Result<void>> {
    const reply = await this.db.from("watch_items").delete().eq("id", itemId).select("id")
    const rows = unwrap<Ids>(reply)
    return !rows.ok ? rows : rows.value.length > 0 ? ok(undefined) : err(NOT_YOURS)
  }

  private async change(itemId: string, patch: Record<string, unknown>): Promise<Result<void>> {
    const reply = await this.db.from("watch_items").update(patch).eq("id", itemId).select("id")
    const rows = unwrap<Ids>(reply)
    return !rows.ok ? rows : rows.value.length > 0 ? ok(undefined) : err(GONE)
  }
}
