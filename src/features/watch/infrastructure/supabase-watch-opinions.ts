import type { Result } from "@/shared/domain"
import { done, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { WatchOpinionGateway } from "../application/ports"
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

  setOpinion(spaceId: string, itemId: string, opinion: Opinion | null) {
    if (opinion === null)
      return done(this.db.from("watch_opinions").delete().eq("watch_item_id", itemId))
    const row = { space_id: spaceId, watch_item_id: itemId, opinion }
    return done(this.db.from("watch_opinions").upsert(row, { onConflict: "user_id,watch_item_id" }))
  }
}
