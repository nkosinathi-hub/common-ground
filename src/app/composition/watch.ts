import { provideWatch, WatchService } from "@/features/watch"
import type { MemberDirectory } from "@/shared/domain"
import { SupabaseWatchGateway } from "@/features/watch/infrastructure/supabase-watch-gateway"
import type { Db } from "@/shared/infrastructure/supabase"

export const composeWatch = (db: Db) => new WatchService(new SupabaseWatchGateway(db))

export function provideWatchFeature(service: WatchService, members: MemberDirectory): void {
  provideWatch({ service, members })
}
