import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import type { MediaRef } from "../../domain/media-ref"
import type { PlaybackLog } from "../../domain/plugin.types"
import type { PlaybackPrefs } from "../../domain/provider.types"
import type { PlayableSource } from "../../domain/source.types"
import { TICKS_PER_SECOND, type JellyfinSession } from "./client"
import { deviceProfile, type CodecProbe } from "./device-profile"
import type { JellyfinItem } from "./items"
import { findEpisode, findTitle } from "./lookup"
import { toSource, type PlaybackInfo } from "./media-sources"
import { mediaSegments } from "./segments"

export interface ResolveDeps {
  readonly providerId: string
  readonly probe: CodecProbe
  readonly log: PlaybackLog
  readonly cache: Map<string, JellyfinItem>
}

const DEFAULT_BITRATE = 20_000_000

async function playableItem(
  session: JellyfinSession,
  ref: MediaRef,
  deps: ResolveDeps,
  signal: AbortSignal,
): Promise<Result<JellyfinItem>> {
  const title = await findTitle(session, ref, deps.cache, signal)
  if (!title.ok || ref.kind === "movie") return title
  const flag = (reason: string) =>
    deps.log.record({ providerId: deps.providerId, outcome: "mismatch", ms: 0, reason })
  return findEpisode(session, title.value, ref, flag, signal)
}

/** Item, then PlaybackInfo with this device's profile, then sources with segments and resume. */
export async function resolveJellyfin(
  session: JellyfinSession,
  ref: MediaRef,
  deps: ResolveDeps,
  signal: AbortSignal,
  prefs: PlaybackPrefs = {},
): Promise<Result<PlayableSource[]>> {
  const item = await playableItem(session, ref, deps, signal)
  if (!item.ok) return item
  const id = item.value.Id
  const maxBitrate = prefs.maxBitrate ?? DEFAULT_BITRATE
  const body = {
    ...{ UserId: session.credential.userId, MaxStreamingBitrate: maxBitrate },
    ...{ DeviceProfile: deviceProfile(deps.probe, maxBitrate), AutoOpenLiveStream: false },
    ...{ EnableDirectPlay: true, EnableDirectStream: true, EnableTranscoding: true },
    ...(prefs.audioIndex === undefined ? {} : { AudioStreamIndex: prefs.audioIndex }),
    ...(prefs.subtitleIndex === undefined ? {} : { SubtitleStreamIndex: prefs.subtitleIndex }),
  }
  const reply = await session.post(`/Items/${id}/PlaybackInfo`, body, { signal })
  if (!reply.ok) return reply
  const info = reply.value as PlaybackInfo
  const segments = await mediaSegments(session, id, signal)
  const resume = (item.value.UserData?.PlaybackPositionTicks ?? 0) / TICKS_PER_SECOND
  const { IndexNumber: from, IndexNumberEnd: to } = item.value
  const range = from !== undefined && to !== undefined ? { episodes: { from, to } } : {}
  const sources = (info.MediaSources ?? []).flatMap((media) => {
    const source = toSource(session, id, info, media, deps.providerId)
    if (!source) return []
    return [{ ...source, segments, ...(resume > 0 ? { resumeSeconds: resume } : {}), ...range }]
  })
  return sources.length ? ok(sources) : err(appError("not_found", "Jellyfin offered no stream"))
}
