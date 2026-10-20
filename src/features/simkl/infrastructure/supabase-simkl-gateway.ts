import { map, type Result } from "@/shared/domain"
import { invokeFunction, type FunctionCopy } from "@/shared/infrastructure/functions"
import { settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { SimklGateway } from "../application/ports"
import type { PinStart, SimklLink, SyncResult } from "../domain/types"

/** The simkl function writes its own user copy, "not set up" included, for every kind. */
const SIMKL_COPY: FunctionCopy = {
  outage: "Simkl is unavailable right now. Try again later",
  copy: { unauthenticated: "Please sign in again" },
  ownCopy: ["validation", "denied", "not_found", "rate_limited", "network"],
}

interface LinkRow {
  readonly connected_at: string
  readonly last_synced_at: string | null
}

const toLink = (row: LinkRow | null): SimklLink | null =>
  row ? { connectedAt: row.connected_at, lastSyncedAt: row.last_synced_at } : null

/** The caller's simkl_links row (never its token column) and the simkl Edge Function. */
export class SupabaseSimklGateway implements SimklGateway {
  constructor(private readonly db: Db) {}

  private invoke<T>(body: Record<string, unknown>): Promise<Result<T>> {
    return invokeFunction<T>(this.db, "simkl", body, SIMKL_COPY)
  }

  status = () =>
    settle(this.db.from("simkl_links").select("connected_at, last_synced_at").maybeSingle(), toLink)

  startPin = () => this.invoke<PinStart>({ action: "pin" })

  poll = (userCode: string) => this.invoke<{ connected: boolean }>({ action: "poll", userCode })

  sync = () => this.invoke<SyncResult>({ action: "sync" })

  disconnect = async () =>
    map(await this.invoke<unknown>({ action: "disconnect" }), () => undefined)
}
