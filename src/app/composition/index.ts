import { createSupabase, type Db } from "@/shared/infrastructure/supabase"
import { composeCollaboration, provideCollaboration } from "./collaboration"
import { composeCore, provideCore } from "./core"

/** The only place adapters are constructed. Features receive services through context. */
export function compose(db: Db = createSupabase()) {
  const core = composeCore(db)
  return { ...core, collaboration: composeCollaboration(db) }
}

export type Services = ReturnType<typeof compose>

export function provideServices(services: Services): void {
  provideCore(services)
  provideCollaboration(services.collaboration)
}
