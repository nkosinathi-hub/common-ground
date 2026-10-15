import { createSupabase, type Db } from "@/shared/infrastructure/supabase"
import { composeCollaboration, provideCollaboration } from "./collaboration"
import { composeCore, provideCore } from "./core"
import { memberDirectory } from "./members"
import { composeWatch, provideWatchFeature } from "./watch"

/** The only place adapters are constructed. Features receive services through context. */
export function compose(db: Db = createSupabase()) {
  const core = composeCore(db)
  const members = memberDirectory(core.spaces)
  return { ...core, members, watch: composeWatch(db), collaboration: composeCollaboration(db) }
}

export type Services = ReturnType<typeof compose>

export function provideServices(services: Services): void {
  provideCore(services)
  provideCollaboration(services.collaboration)
  provideWatchFeature(services.watch, services.members)
}
