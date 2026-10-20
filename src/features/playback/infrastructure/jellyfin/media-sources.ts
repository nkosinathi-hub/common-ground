import type { PlayableSource, Subtitle } from "../../domain/source.types"
import { withoutToken, type JellyfinSession } from "./client"

interface Stream {
  readonly Type?: string
  readonly Index?: number
  readonly Height?: number
  readonly DeliveryMethod?: string
  readonly DeliveryUrl?: string
  readonly IsTextSubtitleStream?: boolean
  readonly Language?: string
  readonly DisplayTitle?: string
}

export interface MediaSource {
  readonly Id: string
  readonly Container?: string
  readonly SupportsDirectPlay?: boolean
  readonly SupportsDirectStream?: boolean
  readonly TranscodingUrl?: string
  readonly MediaStreams?: readonly Stream[]
}

export interface PlaybackInfo {
  readonly PlaySessionId?: string
  readonly MediaSources?: readonly MediaSource[]
}

/** External text tracks only; image subtitles reach the viewer burned in (SubtitleMethod Encode). */
function subtitlesOf(session: JellyfinSession, media: MediaSource): Subtitle[] {
  return (media.MediaStreams ?? [])
    .filter((s) => s.Type === "Subtitle" && s.DeliveryMethod === "External" && s.DeliveryUrl)
    .map((s) => ({
      url: withoutToken(session.url(s.DeliveryUrl ?? "")),
      language: s.Language ?? "und",
      label: s.DisplayTitle ?? s.Language ?? "Subtitles",
    }))
}

/** Direct play (`stream?static=true`) when the profile allows it, otherwise the HLS master. */
export function toSource(
  session: JellyfinSession,
  itemId: string,
  info: PlaybackInfo,
  media: MediaSource,
  providerId: string,
): PlayableSource | null {
  const direct = media.SupportsDirectPlay || media.SupportsDirectStream
  if (!direct && !media.TranscodingUrl) return null
  const url = direct
    ? session.url(`/Videos/${itemId}/stream`, { static: true, mediaSourceId: media.Id })
    : withoutToken(session.url(media.TranscodingUrl ?? ""))
  const height = media.MediaStreams?.find((s) => s.Type === "Video")?.Height
  return {
    kind: direct ? "file" : "hls",
    url,
    ...(direct ? { mime: `video/${media.Container ?? "mp4"}` } : {}),
    ...(height ? { quality: height } : {}),
    subtitles: subtitlesOf(session, media),
    segments: [],
    providerId,
    requestHeaders: session.headers,
    providerData: { itemId, mediaSourceId: media.Id, playSessionId: info.PlaySessionId ?? "" },
  }
}
