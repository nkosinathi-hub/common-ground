import type { PartyCommand, PartyPhase, Presence } from "./party-machine"
import type { Timeline } from "./timeline"

/**
 * What members broadcast on the party channel. Members are trusted people, but a message is
 * still untrusted input: parseMessage rebuilds it from checked fields or drops it.
 */
export type PartyMessage =
  | { readonly kind: "ping"; readonly from: string; readonly id: string; readonly sentAt: number }
  | {
      readonly kind: "pong"
      readonly from: string
      readonly to: string
      readonly id: string
      readonly sentAt: number
      readonly peerReceivedAt: number
      readonly peerSentAt: number
    }
  | {
      readonly kind: "command"
      readonly from: string
      readonly action: PartyCommand
      readonly position: number
      readonly at: number
    }
  | {
      readonly kind: "state"
      readonly from: string
      readonly phase: PartyPhase
      readonly hostId: string
      readonly timeline: Timeline
    }
  | { readonly kind: "snapshot-request" | "finished"; readonly from: string }

type Raw = Record<string, unknown>
const PHASES: readonly string[] = ["lobby", "playing", "paused", "waiting", "ended"]
const ACTIONS: readonly string[] = ["play", "pause", "seek"]

const isRaw = (v: unknown): v is Raw => typeof v === "object" && v !== null
const id = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 64
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)
const pos = (v: unknown): v is number => num(v) && v >= 0

function timeline(v: unknown): Timeline | null {
  if (!isRaw(v) || typeof v.playing !== "boolean" || !pos(v.position) || !num(v.at)) return null
  return { playing: v.playing, position: v.position, at: v.at }
}

function parseKind(m: Raw, from: string): PartyMessage | null {
  switch (m.kind) {
    case "ping":
      return id(m.id) && num(m.sentAt) ? { kind: "ping", from, id: m.id, sentAt: m.sentAt } : null
    case "pong": {
      const { to, id: ping, sentAt, peerReceivedAt: r, peerSentAt: s } = m
      if (!id(to) || !id(ping) || !num(sentAt) || !num(r) || !num(s)) return null
      return { kind: "pong", from, to, id: ping, sentAt, peerReceivedAt: r, peerSentAt: s }
    }
    case "command":
      if (!ACTIONS.includes(m.action as string) || !pos(m.position) || !num(m.at)) return null
      return {
        kind: "command",
        from,
        action: m.action as PartyCommand,
        position: m.position,
        at: m.at,
      }
    case "state": {
      const t = timeline(m.timeline)
      if (!PHASES.includes(m.phase as string) || !id(m.hostId) || !t) return null
      return { kind: "state", from, phase: m.phase as PartyPhase, hostId: m.hostId, timeline: t }
    }
    case "snapshot-request":
    case "finished":
      return { kind: m.kind, from }
    default:
      return null
  }
}

export function parseMessage(raw: unknown): PartyMessage | null {
  return isRaw(raw) && id(raw.from) ? parseKind(raw, raw.from) : null
}

export function parsePresence(raw: unknown): Presence | null {
  if (!isRaw(raw) || !id(raw.userId) || typeof raw.joinedAt !== "string") return null
  if (typeof raw.ready !== "boolean" || typeof raw.buffering !== "boolean") return null
  return { userId: raw.userId, ready: raw.ready, buffering: raw.buffering, joinedAt: raw.joinedAt }
}
