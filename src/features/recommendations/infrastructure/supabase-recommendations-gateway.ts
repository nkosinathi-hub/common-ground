import type { Page, Result } from "@/shared/domain"
import { newestFirst, pageOf } from "@/shared/infrastructure/paging"
import { done, settle, signedOut } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type {
  InboxPageRequest,
  RecommendationsGateway,
  RecommendRequest,
} from "../application/ports"
import type { Recommendation, RecommendationResponse } from "../domain/recommendation"

// One literal, so the typed client can parse the embedded title and sender.
const INBOX_COLUMNS = `id, space_id, watch_item_id, note, created_at, item:watch_items!recommendations_watch_item_fkey(title), sender:profiles!recommendations_sender_id_fkey(display_name)`

interface InboxRow {
  readonly id: string
  readonly space_id: string
  readonly watch_item_id: string
  readonly note: string | null
  readonly created_at: string
  readonly item: { readonly title: string } | null
  readonly sender: { readonly display_name: string } | null
}

/** The inbox query selects pending rows only, so every row it maps is pending. */
const toRecommendation = (row: InboxRow): Recommendation => ({
  id: row.id,
  createdAt: row.created_at,
  spaceId: row.space_id,
  itemId: row.watch_item_id,
  itemTitle: row.item?.title ?? null,
  senderName: row.sender?.display_name ?? null,
  note: row.note,
  status: "pending",
})

/** Reads through RLS (sender or recipient only); writes go through the recommendation RPCs. */
export class SupabaseRecommendationsGateway implements RecommendationsGateway {
  constructor(private readonly db: Db) {}

  recommend({ itemId, recipientIds, note }: RecommendRequest): Promise<Result<string[]>> {
    // The RPC stores an empty note as null.
    const reply = this.db.rpc("recommend", {
      item: itemId,
      recipient_ids: [...recipientIds],
      note: note ?? "",
    })
    return settle(reply, (ids) => ids ?? [])
  }

  async inbox({ spaceId, after }: InboxPageRequest): Promise<Result<Page<Recommendation>>> {
    const { data: auth } = await this.db.auth.getUser()
    if (!auth.user) return signedOut()
    const query = this.db
      .from("recommendations")
      .select(INBOX_COLUMNS)
      .eq("space_id", spaceId)
      .eq("recipient_id", auth.user.id)
      .eq("status", "pending")
    return settle(newestFirst(query, after), pageOf(toRecommendation))
  }

  respond(id: string, response: RecommendationResponse): Promise<Result<void>> {
    return done(this.db.rpc("respond_recommendation", { target: id, response }))
  }
}
