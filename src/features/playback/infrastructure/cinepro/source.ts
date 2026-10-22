import type { SourceKind, Subtitle } from "../../domain/source.types"

/** A URL on the Core origin itself, absolute or relative; anything else is dropped. */
export function sameOriginUrl(raw: unknown, origin: string): string | null {
  if (typeof raw !== "string" || !raw) return null
  try {
    const url = new URL(raw, `${origin}/`)
    return url.origin === origin ? url.href : null
  } catch {
    return null
  }
}

/** OMSS source types (hls, dash, mp4, mkv, webm, http, embed) to the player's kinds. */
export function sourceKind(raw: unknown): SourceKind | null {
  if (typeof raw !== "string") return null
  const value = raw.toLowerCase()
  if (value === "hls" || value.includes("m3u8")) return "hls"
  if (value === "dash" || value.includes("mpd")) return "dash"
  if (["file", "http", "mp4", "mkv", "webm"].includes(value)) return "file"
  if (["embed", "iframe"].includes(value)) return "embed"
  return null
}

/** The container's MIME type when the browser needs it to judge a file; mp4 is the default. */
export function sourceMime(raw: unknown): string | undefined {
  const value = typeof raw === "string" ? raw.toLowerCase() : ""
  if (value === "mkv") return "video/x-matroska"
  if (value === "webm") return "video/webm"
  return undefined
}

/** OMSS quality labels (8K down to SD; Auto is unknown) or a "1080p" style value, in lines. */
const LABELS: Record<string, number> = {
  "8k": 4320,
  "4k": 2160,
  qhd: 1440,
  fhd: 1080,
  hd: 720,
  sd: 480,
}

export function sourceQuality(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw
  if (typeof raw !== "string") return undefined
  const value = raw.trim().toLowerCase()
  const match = /^(\d{3,4})p$/.exec(value)
  return match ? Number(match[1]) : LABELS[value]
}

/** WebVTT tracks on the Core origin; the player renders no other subtitle format. */
export function sourceSubtitles(raw: unknown, origin: string): Subtitle[] {
  if (!Array.isArray(raw)) return []
  return (raw as unknown[]).flatMap((item) => {
    const track = item as { url?: unknown; label?: unknown; format?: unknown } | null
    if (typeof track?.format === "string" && track.format.toLowerCase() !== "vtt") return []
    const url = sameOriginUrl(track?.url, origin)
    if (!url) return []
    const label = typeof track?.label === "string" ? track.label : "Subtitles"
    return [{ url, label, language: label }]
  })
}
