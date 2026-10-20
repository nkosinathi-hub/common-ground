import { done } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { EpisodeTick, HistorySource, WatchHistoryGateway } from "../application/ports"

/** mark_episode_watched: a film sends null season and episode (the generated types say number). */
export class SupabaseWatchHistory implements WatchHistoryGateway {
  constructor(private readonly db: Db) {}

  markWatched = (itemId: string, tick: EpisodeTick | null, source: HistorySource) =>
    done(
      this.db.rpc("mark_episode_watched", {
        item: itemId,
        watched_season: (tick?.season ?? null) as number,
        watched_episode: (tick?.episode ?? null) as number,
        origin: source,
      }),
    )
}
