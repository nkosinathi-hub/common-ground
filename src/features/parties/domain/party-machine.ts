import { pausedAt, playingFrom, positionAt, type Timeline } from "./timeline"

export type PartyPhase = "lobby" | "playing" | "paused" | "waiting" | "ended"

/** What each member shows in presence. Ready needs a tap, so a browser lets the start play. */
export interface Presence {
  readonly userId: string
  readonly ready: boolean
  readonly buffering: boolean
  readonly joinedAt: string
}

export interface PartyState {
  readonly phase: PartyPhase
  readonly timeline: Timeline
  readonly hostId: string
  readonly people: readonly Presence[]
}

export type PartyCommand = "play" | "pause" | "seek"

export type PartyEvent =
  | { readonly type: "presence"; readonly people: readonly Presence[]; readonly at: number }
  | {
      readonly type: "command"
      readonly by: string
      readonly action: PartyCommand
      readonly position: number
      readonly at: number
    }
  | {
      readonly type: "snapshot"
      readonly phase: PartyPhase
      readonly timeline: Timeline
      readonly hostId: string
    }
  | { readonly type: "host"; readonly hostId: string }
  | { readonly type: "finish" }

export const initialParty = (hostId: string): PartyState => ({
  phase: "lobby",
  timeline: pausedAt(0, 0),
  hostId,
  people: [],
})

const anyoneBuffering = (state: PartyState) => state.people.some((p) => p.buffering)

/** Everyone present tapped Ready and nobody is still loading. */
export const canStart = (state: PartyState): boolean =>
  state.people.length > 0 && state.people.every((p) => p.ready) && !anyoneBuffering(state)

/** The group waited for someone buffering, and nobody is any more: the host plays again. */
export const shouldResume = (state: PartyState): boolean =>
  state.phase === "waiting" && !anyoneBuffering(state)

function command(state: PartyState, e: Extract<PartyEvent, { type: "command" }>): PartyState {
  if (e.action === "seek") {
    if (e.by !== state.hostId) return state
    const timeline = state.timeline.playing
      ? playingFrom(e.position, e.at)
      : pausedAt(e.position, e.at)
    return { ...state, timeline }
  }
  if (e.action === "pause")
    return { ...state, phase: "paused", timeline: pausedAt(e.position, e.at) }
  if (state.phase === "lobby" && (e.by !== state.hostId || !canStart(state))) return state
  // The host resumes a wait when it sees nobody buffering; a guest's view may still lag.
  if (state.phase === "waiting" && e.by !== state.hostId && anyoneBuffering(state)) return state
  return { ...state, phase: "playing", timeline: playingFrom(e.position, e.at) }
}

function presence(state: PartyState, e: Extract<PartyEvent, { type: "presence" }>): PartyState {
  const next = { ...state, people: e.people }
  if (state.phase !== "playing" || !anyoneBuffering(next)) return next
  return { ...next, phase: "waiting", timeline: pausedAt(positionAt(state.timeline, e.at), e.at) }
}

/** The party state machine; every member runs it on the same events. */
export function reduce(state: PartyState, event: PartyEvent): PartyState {
  if (state.phase === "ended") return state
  switch (event.type) {
    case "presence":
      return presence(state, event)
    case "command":
      return command(state, event)
    case "snapshot":
      return { ...state, phase: event.phase, timeline: event.timeline, hostId: event.hostId }
    case "host":
      return { ...state, hostId: event.hostId }
    case "finish":
      return { ...state, phase: "ended" }
  }
}
