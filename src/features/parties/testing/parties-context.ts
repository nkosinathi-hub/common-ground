import { FakeMemberDirectory } from "@/shared/domain/testing/fake-members"
import { PartyService } from "../application/party-service"
import type { PlayerControl } from "../application/ports"
import { FakePartyGateway } from "./fake-party-gateway"
import { FakePartyHub } from "./fake-party-hub"

/** Everything provideParties needs, as fakes; the signed-in member is `me`. */
export function partiesFakes(me = "me", player: PlayerControl | null = null) {
  const gateway = new FakePartyGateway(me)
  const hub = new FakePartyHub()
  const members = new FakeMemberDirectory([
    { id: "me", displayName: "Nkosi" },
    { id: "lindi", displayName: "Lindi" },
  ])
  const context = {
    service: new PartyService(gateway),
    channel: hub,
    members,
    clock: { now: () => Date.now() },
    player: () => player,
  }
  return { gateway, hub, members, context }
}
