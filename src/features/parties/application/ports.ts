import type { Result } from "@/shared/domain"
import type { PartyMessage } from "../domain/messages"
import type { Party, StartParty, TogetherProgress } from "../domain/party"
import type { Presence } from "../domain/party-machine"

/** The party RPCs and reads. Progress is credited only by the server (finish_party). */
export interface PartyGateway {
  start(input: StartParty): Promise<Result<string>>
  join(partyId: string): Promise<Result<void>>
  confirm(partyId: string): Promise<Result<void>>
  finish(partyId: string): Promise<Result<void>>
  cancel(partyId: string): Promise<Result<void>>
  handover(partyId: string): Promise<Result<void>>
  get(partyId: string): Promise<Result<Party>>
  /** The planned or live party for a title, if there is one. */
  openFor(watchItemId: string): Promise<Result<Party | null>>
  together(watchItemId: string): Promise<Result<TogetherProgress>>
}

/** joined: subscribed (again, after a drop); reconnecting: lost and retrying; closed: left. */
export type ChannelStatus = "joined" | "reconnecting" | "closed"

export interface PartyChannelHandlers {
  onMessage(message: PartyMessage): void
  onPresence(people: readonly Presence[]): void
  onStatus(status: ChannelStatus): void
}

/** One member's live link to a party's private channel. */
export interface PartyConnection {
  send(message: PartyMessage): void
  /** This member's presence (ready, buffering); kept across reconnects. */
  track(presence: Presence): void
  leave(): void
}

/** Opens the private broadcast and presence channel 'party:<id>'. */
export interface PartyChannel {
  connect(partyId: string, handlers: PartyChannelHandlers): PartyConnection
}

/**
 * What the party needs from a video player; the player feature implements it. Times are seconds
 * into the title. play() may need a user gesture the first time (the Ready tap arms it).
 */
export interface PlayerControl {
  play(): Promise<void>
  pause(): void
  seek(seconds: number): void
  setRate(rate: number): void
  currentTime(): number
  /** Called with true when playback stalls to load and false when it can play; returns unsubscribe. */
  onBuffering(listener: (buffering: boolean) => void): () => void
}

/** The local clock in milliseconds. */
export interface Clock {
  now(): number
}
