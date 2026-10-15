import { appError, err, ok, type AppError, type Result } from "@/shared/domain"
import { removed, settle, signedOut, type QueryReply } from "@/shared/infrastructure/query"
import type { ListRequest, WatchGateway } from "../application/ports"
import { pageOf } from "../domain/filters"
import type * as T from "../domain/types"
import { SupabaseWatchProgress } from "./supabase-watch-progress"
import { catalogArgs, detailColumns, listArgs } from "./watch-args"
import { ITEM_COLUMNS, settleAdd, toItem } from "./watch-rows"

const GONE: AppError = appError("not_found", "That title is no longer on your list")

/** RLS hides rows it refuses to update, so an update that touched no row found nothing. */
async function updated(query: PromiseLike<QueryReply<{ id: string }[]>>): Promise<Result<void>> {
  const rows = await settle(query, (ids) => ids.length)
  if (!rows.ok) return rows
  return rows.value > 0 ? ok(undefined) : err(GONE)
}

/** Watchlist adapter. Visibility and permissions are enforced by RLS and the watch RPCs. */
export class SupabaseWatchGateway extends SupabaseWatchProgress implements WatchGateway {
  list(request: ListRequest): Promise<Result<T.WatchPage>> {
    return settle(this.db.rpc("list_watch_items", listArgs(request)), (rows) => {
      const keyed = rows.map((row) => ({ item: toItem(row), sortKey: row.sort_key ?? "" }))
      return pageOf(keyed, request.size)
    })
  }

  async get(spaceId: string, itemId: string): Promise<Result<T.WatchItemView>> {
    const me = await this.me()
    if (!me) return signedOut()
    const [found, owner, mine] = await Promise.all([
      settle(
        this.db.from("watch_items").select(ITEM_COLUMNS).eq("space_id", spaceId).eq("id", itemId),
        (rows) => rows[0],
      ),
      this.db.rpc("is_space_owner", { target_space: spaceId }),
      this.db.from("watch_progress").select("status").eq("watch_item_id", itemId).eq("user_id", me),
    ])
    if (!found.ok) return found
    if (!found.value) return err(GONE)
    const canDelete = owner.data === true || found.value.created_by === me
    return ok({ item: toItem(found.value, mine.data?.[0]?.status), canDelete })
  }

  addCatalog = (spaceId: string, pick: T.CatalogPick, intent: T.SharedIntent) =>
    settleAdd(this.db.rpc("add_catalog_title", catalogArgs(spaceId, pick, intent)), (id) => id)

  addManual(spaceId: string, input: T.ManualTitleInput): Promise<Result<string>> {
    const row = { space_id: spaceId, ...detailColumns(input), shared_intent: input.intent }
    const query = this.db.from("watch_items").insert(row).select("id").single()
    return settleAdd(query, (created) => created.id)
  }

  updateDetails = (itemId: string, input: T.TitleDetailsInput) =>
    updated(this.db.from("watch_items").update(detailColumns(input)).eq("id", itemId).select("id"))

  setIntent = (itemId: string, intent: T.SharedIntent) =>
    updated(
      this.db.from("watch_items").update({ shared_intent: intent }).eq("id", itemId).select("id"),
    )

  remove = (itemId: string) =>
    removed(this.db.from("watch_items").delete().eq("id", itemId).select("id"))
}
