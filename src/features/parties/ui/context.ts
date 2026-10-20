import { getContext, setContext } from "svelte"
import type { MemberDirectory } from "@/shared/domain"
import type { PartyService } from "../application/party-service"
import type { Clock, PartyChannel, PlayerControl } from "../application/ports"

export interface PartiesContext {
  readonly service: PartyService
  readonly channel: PartyChannel
  /** Current members, to name the people in a party. */
  readonly members: MemberDirectory
  readonly clock: Clock
  /** The in-app player for a jellyfin party, once the player feature provides one. */
  readonly player: () => PlayerControl | null
}

const KEY = Symbol("parties")

export function provideParties(value: PartiesContext): void {
  setContext(KEY, value)
}

export function useParties(): PartiesContext {
  const value = getContext<PartiesContext | undefined>(KEY)
  if (!value)
    throw new Error("Parties are not provided: call provideParties in the composition root")
  return value
}
