import type { CatalogService } from "@/features/catalog"
import {
  provideWatch,
  WatchHistory,
  WatchOpinions,
  WatchService,
  type WatchContext,
} from "@/features/watch"
import { map } from "@/shared/domain"
import { SupabaseWatchGateway } from "@/features/watch/infrastructure/supabase-watch-gateway"
import { SupabaseWatchHistory } from "@/features/watch/infrastructure/supabase-watch-history"
import { SupabaseWatchOpinions } from "@/features/watch/infrastructure/supabase-watch-opinions"
import type { Db } from "@/shared/infrastructure/supabase"

export const composeWatch = (db: Db) => new WatchService(new SupabaseWatchGateway(db))
export const composeWatchHistory = (db: Db) => new WatchHistory(new SupabaseWatchHistory(db))
export const composeWatchOpinions = (db: Db) => new WatchOpinions(new SupabaseWatchOpinions(db))

/** The watch feature's context; the catalog supplies a series' seasons without watch importing it. */
export function provideWatchFeature(
  parts: Omit<WatchContext, "seasons">,
  catalog: CatalogService,
): void {
  provideWatch({
    ...parts,
    seasons: async (spaceId, id) =>
      map(await catalog.details(spaceId, { type: "tv", id }), (details) =>
        details.seasons.filter((season) => season.number > 0),
      ),
  })
}
