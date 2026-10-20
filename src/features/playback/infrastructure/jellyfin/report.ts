import type { PlaybackEvent } from "../../domain/provider.types"
import { TICKS_PER_SECOND, type JellyfinSession } from "./client"

const PATHS: Record<PlaybackEvent["kind"], string> = {
  start: "/Sessions/Playing",
  progress: "/Sessions/Playing/Progress",
  stop: "/Sessions/Playing/Stopped",
}

/** Progress back to Jellyfin, whose UserData resume point is the canonical one. */
export async function reportJellyfin(session: JellyfinSession, event: PlaybackEvent) {
  const data = event.source.providerData ?? {}
  if (!data.itemId) return
  const body = {
    ItemId: data.itemId,
    MediaSourceId: data.mediaSourceId,
    PlaySessionId: data.playSessionId,
    PositionTicks: Math.round(event.positionSeconds * TICKS_PER_SECOND),
    IsPaused: event.paused,
    CanSeek: true,
  }
  await session.send(PATHS[event.kind], body, event.keepalive)
}
