import type { SupabaseClient } from "@supabase/supabase-js"
import { appError, err, ok, type Cursor, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type { Db } from "@/shared/infrastructure/supabase"
import type { RecommendationsGateway } from "../application/ports"
import type { Recommendation, RecommendationResponse } from "../domain/recommendation"

type Reply<T> = { data: T | null; error: { code?: string; message?: string } | null }

interface InboxRow {
  id: string
  space_id: string
  watch_item_id: string
  note: string | null
  status: Recommendation["status"]
  created_at: string
  item: { title: string } | null
  sender: { display_name: string } | null
}

const INBOX_COLUMNS =
  "id, space_id, watch_item_id, note, status, created_at, " +
  "item:watch_items!recommendations_watch_item_fkey(title), " +
  "sender:profiles!recommendations_sender_id_fkey(display_name)"

const toRecommendation = (row: InboxRow): Recommendation => ({
  id: row.id,
  createdAt: row.created_at,
  spaceId: row.space_id,
  itemId: row.watch_item_id,
  itemTitle: row.item?.title ?? null,
  senderName: row.sender?.display_name ?? null,
  note: row.note,
  status: row.status,
})

/** Reads through RLS (sender or recipient only); writes go through the recommendation RPCs. */
export class SupabaseRecommendationsGateway implements RecommendationsGateway {
  private readonly db: SupabaseClient

  // The recommendations table arrives in the generated types once the watch migrations land.
  constructor(db: Db) {
    this.db = db as unknown as SupabaseClient
  }

  async recommend(itemId: string, recipientIds: readonly string[], note: string | null) {
    const reply: Reply<string[]> = await this.db.rpc("recommend", {
      item: itemId,
      recipient_ids: recipientIds,
      note,
    })
    return reply.error ? err(toAppError(reply.error)) : ok(reply.data ?? [])
  }

  async inbox(
    spaceId: string,
    before: Cursor | null,
    size: number,
  ): Promise<Result<Recommendation[]>> {
    const { data: auth } = await this.db.auth.getUser()
    if (!auth.user) return err(appError("unauthenticated", "Please sign in again"))
    let query = this.db
      .from("recommendations")
      .select(INBOX_COLUMNS)
      .eq("space_id", spaceId)
      .eq("recipient_id", auth.user.id)
      .eq("status", "pending")
    if (before)
      query = query.or(
        `created_at.lt."${before.createdAt}",and(created_at.eq."${before.createdAt}",id.lt.${before.id})`,
      )
    const reply = (await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(size)) as unknown as Reply<InboxRow[]>
    return reply.error ? err(toAppError(reply.error)) : ok((reply.data ?? []).map(toRecommendation))
  }

  async respond(id: string, response: RecommendationResponse): Promise<Result<void>> {
    const { error } = await this.db.rpc("respond_recommendation", { target: id, response })
    return error ? err(toAppError(error)) : ok(undefined)
  }
}
