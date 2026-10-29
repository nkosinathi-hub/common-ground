import { provideWatch, WatchHistory, WatchService } from "@/features/watch"
import type { AuthorDirectory, MemberDirectory } from "@/shared/domain"
import { SupabaseWatchGateway } from "@/features/watch/infrastructure/supabase-watch-gateway"
import { SupabaseWatchHistory } from "@/features/watch/infrastructure/supabase-watch-history"
import type { Db } from "@/shared/infrastructure/supabase"

export const composeWatch = (db: Db) => new WatchService(new SupabaseWatchGateway(db))
export const composeWatchHistory = (db: Db) => new WatchHistory(new SupabaseWatchHistory(db))

export function provideWatchFeature(
  service: WatchService,
  members: MemberDirectory,
  authors: AuthorDirectory,
  history: WatchHistory,
): void {
  provideWatch({ service, members, authors, history })
}
