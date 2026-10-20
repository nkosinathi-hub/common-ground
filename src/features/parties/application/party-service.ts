import type { Result } from "@/shared/domain"
import { nextTogether, validateRange, type EpisodeRange } from "../domain/episode-range"
import type { StartParty } from "../domain/party"
import type { PartyGateway } from "./ports"

/** Party use cases over the RPCs; the server stays authoritative for membership and progress. */
export class PartyService {
  constructor(private readonly gateway: PartyGateway) {}

  async start(input: StartParty): Promise<Result<string>> {
    if (input.range) {
      const valid = validateRange(input.range)
      if (!valid.ok) return valid
    }
    return this.gateway.start(input)
  }

  join = (partyId: string) => this.gateway.join(partyId)
  confirm = (partyId: string) => this.gateway.confirm(partyId)
  finish = (partyId: string) => this.gateway.finish(partyId)
  cancel = (partyId: string) => this.gateway.cancel(partyId)
  handover = (partyId: string) => this.gateway.handover(partyId)
  get = (partyId: string) => this.gateway.get(partyId)
  openFor = (watchItemId: string) => this.gateway.openFor(watchItemId)

  /** The next episode after where the space watched together; a single episode by default. */
  async defaultRange(watchItemId: string): Promise<EpisodeRange> {
    const together = await this.gateway.together(watchItemId)
    const next = nextTogether(together.ok ? (together.value?.at ?? null) : null)
    return { from: next, to: next }
  }
}
