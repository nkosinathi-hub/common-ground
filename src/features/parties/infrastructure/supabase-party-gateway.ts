import { appError, err, ok, type Result } from "@/shared/domain"
import { done, same, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { PartyGateway } from "../application/ports"
import type { Party, PartySource, StartParty } from "../domain/party"
import { PARTY_COLUMNS, startArgs, toParty, toTogether } from "./party-rows"

const GONE = appError("not_found", "That watch party is no longer available")

/** Party RPCs and reads; RLS shows parties to the space's members only. */
export class SupabasePartyGateway implements PartyGateway {
  constructor(private readonly db: Db) {}

  start = (input: StartParty) => settle(this.db.rpc("start_party", startArgs(input)), same)
  join = (party: string) => done(this.db.rpc("join_party", { party }))
  confirm = (party: string) => done(this.db.rpc("confirm_party", { party }))
  finish = (party: string) => done(this.db.rpc("finish_party", { party }))
  cancel = (party: string) => done(this.db.rpc("cancel_party", { party }))
  handover = (party: string) => done(this.db.rpc("handover_party", { party }))

  async get(partyId: string): Promise<Result<Party>> {
    const query = this.db.from("watch_parties").select(PARTY_COLUMNS).eq("id", partyId)
    const found = await settle(query, (rows) => rows[0])
    if (!found.ok) return found
    return found.value ? ok(toParty(found.value)) : err(GONE)
  }

  openFor(watchItemId: string): Promise<Result<Party | null>> {
    const query = this.db
      .from("watch_parties")
      .select(PARTY_COLUMNS)
      .eq("watch_item_id", watchItemId)
      .in("status", ["planned", "live"])
    return settle(query, (rows) => (rows[0] ? toParty(rows[0]) : null))
  }

  /** Open parties on one source in the member's spaces (RLS); the extension lists netflix ones. */
  openOn(source: PartySource): Promise<Result<Party[]>> {
    const query = this.db
      .from("watch_parties")
      .select(PARTY_COLUMNS)
      .eq("source", source)
      .in("status", ["planned", "live"])
      .order("created_at", { ascending: false })
    return settle(query, (rows) => rows.map(toParty))
  }

  together = (watchItemId: string) =>
    settle(
      this.db.from("together_progress").select("season, episode").eq("watch_item_id", watchItemId),
      (rows) => toTogether(rows[0]),
    )
}
