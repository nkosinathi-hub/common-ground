import { appError, err, ok, type AppError, type Result } from "@/shared/domain"
import { removed, same, settle, signedOut, touched } from "@/shared/infrastructure/query"
import type { ListRequest, WatchGateway } from "../application/ports"
import { countTypes, pageOf } from "../domain/filters"
import type * as T from "../domain/types"
import { SupabaseWatchProgress } from "./supabase-watch-progress"
import { catalogArgs, detailColumns, listArgs } from "./watch-args"
import { ITEM_COLUMNS, settleAdd, toItem } from "./watch-rows"

const GONE: AppError = appError("not_found", "That title is no longer on your list")

/** Watchlist adapter. Visibility and permissions are enforced by RLS and the watch RPCs. */
export class SupabaseWatchGateway extends SupabaseWatchProgress implements WatchGateway {
  list(request: ListRequest): Promise<Result<T.WatchPage>> {
    const probe = { ...request, size: request.size + 1 }
    return settle(this.db.rpc("list_watch_items", listArgs(probe)), (rows) => {
      const keyed = rows.map((row) => ({ item: toItem(row), sortKey: row.sort_key ?? "" }))
      return pageOf(keyed, request.size)
    })
  }

  countByType(spaceId: string): Promise<Result<Record<T.MediaType, number>>> {
    const query = this.db
      .from("watch_items")
      .select("media_type")
      .eq("space_id", spaceId)
      .neq("shared_intent", "archived")
    return settle(query, (rows) => countTypes(rows.map((row) => row.media_type)))
  }

  async get(spaceId: string, itemId: string): Promise<Result<T.WatchItemView>> {
    const me = await this.me()
    if (!me) return signedOut()
    const [found, owner, mine] = await Promise.all([
      settle(
        this.db.from("watch_items").select(ITEM_COLUMNS).eq("space_id", spaceId).eq("id", itemId),
        (rows) => rows[0],
      ),
      settle(this.db.rpc("is_space_owner", { target_space: spaceId }), same),
      settle(
        this.db
          .from("watch_progress")
          .select("status")
          .eq("watch_item_id", itemId)
          .eq("user_id", me),
        (rows) => rows[0]?.status,
      ),
    ])
    if (!found.ok) return found
    if (!found.value) return err(GONE)
    if (!owner.ok) return owner
    if (!mine.ok) return mine
    const canDelete = owner.value === true || found.value.created_by === me
    return ok({ item: toItem(found.value, mine.value), canDelete })
  }

  addCatalog = (spaceId: string, pick: T.CatalogPick, intent: T.SharedIntent) =>
    settleAdd(this.db.rpc("add_catalog_title", catalogArgs(spaceId, pick, intent)), same)

  addManual(spaceId: string, input: T.ManualTitleInput): Promise<Result<string>> {
    const row = { space_id: spaceId, ...detailColumns(input), shared_intent: input.intent }
    const query = this.db.from("watch_items").insert(row).select("id").single()
    return settleAdd(query, (created) => created.id)
  }

  updateDetails = (itemId: string, input: T.TitleDetailsInput) =>
    touched(
      this.db.from("watch_items").update(detailColumns(input)).eq("id", itemId).select("id"),
      GONE,
    )

  setIntent = (itemId: string, intent: T.SharedIntent) =>
    touched(
      this.db.from("watch_items").update({ shared_intent: intent }).eq("id", itemId).select("id"),
      GONE,
    )

  remove = (itemId: string) =>
    removed(this.db.from("watch_items").delete().eq("id", itemId).select("id"))
}
