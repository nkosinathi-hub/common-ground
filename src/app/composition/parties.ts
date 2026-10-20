import { PartyService, provideParties } from "@/features/parties"
import { SupabasePartyChannel } from "@/features/parties/infrastructure/supabase-party-channel"
import { SupabasePartyGateway } from "@/features/parties/infrastructure/supabase-party-gateway"
import type { MemberDirectory } from "@/shared/domain"
import type { Db } from "@/shared/infrastructure/supabase"

export const composeParties = (db: Db) => ({
  service: new PartyService(new SupabasePartyGateway(db)),
  channel: new SupabasePartyChannel(db),
})

/** No in-app player yet: the player feature provides a PlayerControl here when it lands. */
export function providePartiesFeature(
  parties: ReturnType<typeof composeParties>,
  members: MemberDirectory,
): void {
  provideParties({ ...parties, members, clock: { now: () => Date.now() }, player: () => null })
}
