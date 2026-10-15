import { provideWatch, WatchService, type MemberDirectory } from "@/features/watch"
import { SupabaseWatchGateway } from "@/features/watch/infrastructure/supabase-watch-gateway"
import type { Db } from "@/shared/infrastructure/supabase"

export const composeWatch = (db: Db) => new WatchService(new SupabaseWatchGateway(db))

export function provideWatchFeature(service: WatchService, members: MemberDirectory): void {
  provideWatch({ service, members })
}
