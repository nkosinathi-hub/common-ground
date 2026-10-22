import type { EpisodeRange, EpisodeRef } from "./episode-range"

/**
 * jellyfin plays in the app in sync; external is a co-watch of playback elsewhere (#58); netflix
 * plays on netflix.com, each member on their own account, driven by the extension (#66).
 */
export type PartySource = "jellyfin" | "external" | "netflix"
export type PartyStatus = "planned" | "live" | "ended" | "cancelled"

export interface PartyMember {
  readonly userId: string
  /** Confirmed they are watching this range; only confirmed members are credited. */
  readonly confirmed: boolean
  readonly joinedAt: string
}

export interface Party {
  readonly id: string
  readonly spaceId: string
  readonly watchItemId: string
  /** The title's name, for the Netflix search link (#66). */
  readonly title: string
  /** The title's TMDB entry, so the in-app player can play it; null for a manual title. */
  readonly catalog: { readonly type: "movie" | "tv"; readonly id: number } | null
  /** Null once the host's account is deleted. */
  readonly hostId: string | null
  readonly source: PartySource
  readonly status: PartyStatus
  /** Null for a film. */
  readonly range: EpisodeRange | null
  readonly startedAt: string | null
  readonly endedAt: string | null
  readonly createdAt: string
  readonly members: readonly PartyMember[]
}

export interface StartParty {
  readonly watchItemId: string
  readonly source: PartySource
  readonly range: EpisodeRange | null
}

/** Where the space has watched a title together: an episode, or a film watched (no episode). */
export type TogetherProgress = { readonly at: EpisodeRef | null } | null

export const isOpen = (party: Party): boolean =>
  party.status === "planned" || party.status === "live"

export const memberOf = (party: Party, userId: string): PartyMember | undefined =>
  party.members.find((m) => m.userId === userId)
