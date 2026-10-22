import { NETFLIX_ORIGIN } from "@/features/parties/domain/netflix"

/**
 * The narrow postMessage bridge between the content script and the MAIN-world page script. It
 * carries one thing, a seek in milliseconds, and its reply. Both ends accept a message only from
 * the netflix.com window itself and rebuild it from checked fields, so nothing else gets across.
 */
export const BRIDGE = "common-ground/netflix-seek"

/** Longer than any title: a seek past it is malformed, not a position. */
const MAX_MS = 24 * 60 * 60 * 1000

export interface SeekRequest {
  readonly channel: typeof BRIDGE
  readonly kind: "seek"
  readonly id: number
  readonly ms: number
}

export interface SeekReply {
  readonly channel: typeof BRIDGE
  readonly kind: "seeked"
  readonly id: number
  readonly ok: boolean
}

/** The parts of a MessageEvent the bridge reads. */
export interface BridgeEvent {
  readonly data: unknown
  readonly origin: string
  readonly source: unknown
}

type Raw = Record<string, unknown>

const isId = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0
const isMs = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= MAX_MS

function ours(event: BridgeEvent, page: unknown, kind: string): Raw | null {
  if (event.origin !== NETFLIX_ORIGIN || event.source !== page) return null
  const data = event.data
  if (typeof data !== "object" || data === null) return null
  const raw = data as Raw
  return raw.channel === BRIDGE && raw.kind === kind && isId(raw.id) ? raw : null
}

export const seekRequest = (id: number, ms: number): SeekRequest => ({
  channel: BRIDGE,
  kind: "seek",
  id,
  ms: Math.round(ms),
})

export const seekReply = (id: number, ok: boolean): SeekReply => ({
  channel: BRIDGE,
  kind: "seeked",
  id,
  ok,
})

export function parseSeekRequest(event: BridgeEvent, page: unknown): SeekRequest | null {
  const raw = ours(event, page, "seek")
  return raw && isMs(raw.ms) ? seekRequest(raw.id as number, raw.ms) : null
}

export function parseSeekReply(event: BridgeEvent, page: unknown): SeekReply | null {
  const raw = ours(event, page, "seeked")
  return raw && typeof raw.ok === "boolean" ? seekReply(raw.id as number, raw.ok) : null
}
