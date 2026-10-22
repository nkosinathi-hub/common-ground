import { describeRange } from "@/features/parties/domain/episode-range"
import { netflixSearchUrl } from "@/features/parties/domain/netflix"
import { isOpen, memberOf, type Party } from "@/features/parties/domain/party"
import { memberName, type MemberRef } from "@/shared/domain"

export interface PartyPerson {
  readonly name: string
  /** Confirmed (pressed Ready), as the server has it. */
  readonly ready: boolean
  readonly host: boolean
}

/** One open Netflix party as the popup lists it. */
export interface PartyRow {
  readonly id: string
  readonly title: string
  readonly what: string
  readonly netflixUrl: string
  readonly people: readonly PartyPerson[]
  /** This member is in the party. */
  readonly joined: boolean
  /** The party this member's netflix.com tab plays. */
  readonly active: boolean
}

export function partyRows(
  parties: readonly Party[],
  names: readonly MemberRef[],
  me: string,
  activeId: string | null,
): PartyRow[] {
  return parties
    .filter((party) => party.source === "netflix" && isOpen(party))
    .map((party) => ({
      id: party.id,
      title: party.title,
      what: party.range ? describeRange(party.range) : "The film",
      netflixUrl: netflixSearchUrl(party.title),
      people: party.members.map((m) => ({
        name: memberName(names, m.userId),
        ready: m.confirmed,
        host: m.userId === party.hostId,
      })),
      joined: memberOf(party, me) !== undefined,
      active: party.id === activeId,
    }))
}
