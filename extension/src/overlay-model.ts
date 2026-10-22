import type { SessionView } from "@/features/parties/application/party-session"
import type { PartyMember } from "@/features/parties/domain/party"
import { canStart, type Presence } from "@/features/parties/domain/party-machine"
import { SYNC } from "@/features/parties/domain/sync-constants"
import { memberName, type MemberRef } from "@/shared/domain"

export interface OverlayInput {
  readonly view: SessionView
  /** Everyone to list: the party's members and anyone present. */
  readonly members: readonly Pick<PartyMember, "userId">[]
  readonly names: readonly MemberRef[]
  /** Seconds this player is behind (+) or ahead (-) of the party, when playing. */
  readonly drift: number | null
  readonly titleId: string | null
}

export interface OverlayModel {
  readonly heading: string
  readonly people: readonly { readonly name: string; readonly status: string }[]
  /** The party's phase, or how close this player is to it. */
  readonly line: string
  /** Offer Ready: this tab has not pressed it yet. */
  readonly ready: boolean
  readonly play: "start" | "resume" | null
  readonly canPlay: boolean
  readonly pause: boolean
}

const PHASES = {
  lobby: "Waiting for everyone",
  playing: "Playing",
  paused: "Paused",
  waiting: "Waiting for someone to catch up",
  ended: "Finished",
} as const

function status(people: readonly Presence[], userId: string): string {
  const mine = people.filter((p) => p.userId === userId)
  const player = mine.find((p) => p.role !== "remote")
  if (player?.buffering) return "Loading"
  if (player) return player.ready ? "Ready" : "Not ready"
  return mine.length > 0 ? "Remote only" : "Not here"
}

function lineOf({ view, drift }: OverlayInput): string {
  if (!view.connected) return "Reconnecting"
  const phase = view.state.phase
  if (phase === "lobby" && !view.ready) return "Press Ready when you are set"
  if (phase !== "playing" || drift === null) return PHASES[phase]
  const off = Math.abs(drift)
  return off <= SYNC.driftToleranceS ? "Synced" : `Drifting ${off.toFixed(1)} s`
}

export function overlayModel(input: OverlayInput): OverlayModel {
  const { view, members, names, titleId } = input
  const { phase, people } = view.state
  const start = phase === "lobby" && view.isHost
  return {
    heading: titleId ? `Common Ground party (Netflix title ${titleId})` : "Common Ground party",
    people: members.map((m) => ({
      name: memberName(names, m.userId),
      status: status(people, m.userId),
    })),
    line: lineOf(input),
    ready: !view.ready,
    play: start ? "start" : phase === "paused" ? "resume" : null,
    canPlay: !start || canStart(view.state),
    pause: phase === "playing" || phase === "waiting",
  }
}
