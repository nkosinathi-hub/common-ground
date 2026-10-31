import type { Result } from "@/shared/domain"
import { done, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { WatchOpinionGateway } from "../application/ports"
import type { ForYouScore } from "../domain/for-you"
import type { Opinion } from "../domain/progress-types"

/** watch_opinions: RLS shows each person only their own row, so no user filter is needed. */
export class SupabaseWatchOpinions implements WatchOpinionGateway {
  constructor(private readonly db: Db) {}

  opinion(itemId: string): Promise<Result<Opinion | null>> {
    const query = this.db
      .from("watch_opinions")
      .select("opinion")
      .eq("watch_item_id", itemId)
      .maybeSingle()
    return settle(query, (row) => row?.opinion ?? null)
  }

  forYou(spaceId: string): Promise<Result<ForYouScore[]>> {
    return settle(this.db.rpc("watch_for_you", { target_space: spaceId }), (rows) =>
      rows.map((row) => ({
        itemId: row.item_id,
        score: Number(row.score),
        reason: row.reason ?? null,
        opinion: row.opinion ?? null,
      })),
    )
  }

  /** set_watch_opinion finds the title's space and updates only the opinion; null clears it. */
  setOpinion(_spaceId: string, itemId: string, opinion: Opinion | null) {
    return done(
      this.db.rpc("set_watch_opinion", { target_item: itemId, choice: opinion ?? undefined }),
    )
  }
}
