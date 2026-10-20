import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import type { PlayableSource, Subtitle } from "../../domain/source.types"
import { requestJson } from "../http"
import type { ApiCaption, ApiFile, ApiVideo } from "./api.types"

const PUBLIC = 1
const PUBLISHED = 1
/** PeerTube's licence ids 1 to 7: the six Creative Commons licences and CC0. */
const OPEN_LICENCE_IDS = new Set([1, 2, 3, 4, 5, 6, 7])
const none = (why: string) => err(appError("not_found", why))

/** A public, published, on-demand video whose licence is open, here or in the curated title. */
export async function openVideo(
  fetcher: typeof fetch,
  origin: string,
  id: string,
  curatedLicence: boolean,
  signal: AbortSignal,
): Promise<Result<ApiVideo>> {
  const url = `${origin}/api/v1/videos/${encodeURIComponent(id)}`
  const reply = await requestJson(fetcher, { url, signal })
  if (!reply.ok) return reply
  const video = (reply.value ?? {}) as ApiVideo
  if (video.privacy?.id !== PUBLIC || video.state?.id !== PUBLISHED || video.isLive)
    return none("The video is not public and published")
  const licensed = OPEN_LICENCE_IDS.has(video.licence?.id ?? 0)
  if (!licensed && !curatedLicence) return none("No explicit Creative Commons licence")
  return ok(video)
}

/** WebVTT captions; captions failing never stops the video playing. */
export async function captions(
  fetcher: typeof fetch,
  origin: string,
  id: string,
  signal: AbortSignal,
): Promise<Subtitle[]> {
  const url = `${origin}/api/v1/videos/${encodeURIComponent(id)}/captions`
  const reply = await requestJson(fetcher, { url, signal })
  const data = reply.ok ? (reply.value as { data?: ApiCaption[] } | null)?.data : undefined
  return (Array.isArray(data) ? data : []).flatMap((c) => {
    const href = c.fileUrl ?? (c.captionPath ? `${origin}${c.captionPath}` : undefined)
    const language = c.language?.id
    if (!href || !language) return []
    return [{ url: href, language, label: c.language?.label ?? language }]
  })
}

/** A single-bitrate file taller than this stalls on a phone; HLS adapts, so it is never capped. */
const MAX_FILE_HEIGHT = 1080
const height = (files: readonly ApiFile[] | undefined) =>
  Math.max(0, ...(files ?? []).map((f) => f.resolution?.id ?? 0))

/**
 * Adaptive HLS first (ranked at its tallest rendition), then each MP4 by height, then the
 * instance's own embed player as the last resort. Audio-only and over-1080p files are skipped.
 */
export function toSources(
  video: ApiVideo,
  subtitles: Subtitle[],
  origin: string,
  providerId: string,
): PlayableSource[] {
  const common = { subtitles, segments: [], providerId }
  const hls = (video.streamingPlaylists ?? []).flatMap((p): PlayableSource[] =>
    p.playlistUrl ? [{ kind: "hls", url: p.playlistUrl, quality: height(p.files), ...common }] : [],
  )
  const files = (video.files ?? []).flatMap((f): PlayableSource[] => {
    const quality = f.resolution?.id ?? 0
    if (!f.fileUrl || quality <= 0 || quality > MAX_FILE_HEIGHT) return []
    return [{ kind: "file", url: f.fileUrl, mime: "video/mp4", quality, ...common }]
  })
  const embedId = video.shortUUID ?? video.uuid
  const embed: PlayableSource[] = embedId
    ? [{ kind: "embed", url: `${origin}/videos/embed/${embedId}`, ...common, subtitles: [] }]
    : []
  return [...hls, ...files.sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0)), ...embed]
}
