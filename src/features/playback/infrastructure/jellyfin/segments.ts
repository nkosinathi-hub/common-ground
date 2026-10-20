import type { Segment, SegmentKind } from "../../domain/source.types"
import { TICKS_PER_SECOND, type JellyfinSession } from "./client"

/** Jellyfin MediaSegment types (written by the Intro Skipper plugin) to ours; Outro is credits. */
const KINDS: Record<string, SegmentKind> = {
  Intro: "intro",
  Outro: "credits",
  Recap: "recap",
  Preview: "preview",
}

interface RawSegment {
  readonly Type?: string
  readonly StartTicks?: number
  readonly EndTicks?: number
}

/** Skip points for an item; none when the server has no segments or the call fails. */
export async function mediaSegments(
  session: JellyfinSession,
  itemId: string,
  signal: AbortSignal,
): Promise<Segment[]> {
  const reply = await session.get(`/MediaSegments/${itemId}`, {}, signal)
  if (!reply.ok) return []
  const raw = (reply.value as { Items?: unknown } | null)?.Items
  if (!Array.isArray(raw)) return []
  return (raw as RawSegment[]).flatMap((s) => {
    const kind = KINDS[s.Type ?? ""]
    if (!kind || typeof s.StartTicks !== "number" || typeof s.EndTicks !== "number") return []
    return [{ kind, start: s.StartTicks / TICKS_PER_SECOND, end: s.EndTicks / TICKS_PER_SECOND }]
  })
}
