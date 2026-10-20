import { PartyService, provideParties } from "@/features/parties"
import { SupabasePartyChannel } from "@/features/parties/infrastructure/supabase-party-channel"
import { SupabasePartyGateway } from "@/features/parties/infrastructure/supabase-party-gateway"
import type { MemberDirectory } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"
import type { ActivePlayer } from "./player-bridge"

export const composeParties = (db: Db) => ({
  service: new PartyService(new SupabasePartyGateway(db)),
  channel: new SupabasePartyChannel(db),
})

/** The party drives whatever video the in-app player shows (player-bridge.ts). */
export function providePartiesFeature(
  parties: ReturnType<typeof composeParties>,
  members: MemberDirectory,
  active: ActivePlayer,
): void {
  provideParties({ ...parties, members, clock: { now: () => Date.now() }, player: active.control })
}
