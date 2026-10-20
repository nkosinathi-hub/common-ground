import type { SourceKind } from "./source.types"

const BY_TYPE: [RegExp, SourceKind][] = [
  [/^application\/(vnd\.apple\.mpegurl|x-mpegurl)/i, "hls"],
  [/^application\/dash\+xml/i, "dash"],
  [/^video\/(mp4|webm)/i, "file"],
]

const BY_PATH: [RegExp, SourceKind][] = [
  [/\.m3u8$/i, "hls"],
  [/\.mpd$/i, "dash"],
  [/\.(mp4|m4v|webm)$/i, "file"],
]

/** The core's default detector: the content type when it says, else the path's extension. */
export function detectFormat(url: string, contentType?: string): SourceKind | null {
  const byType = contentType ? BY_TYPE.find(([rule]) => rule.test(contentType)) : undefined
  if (byType) return byType[1]
  let path: string
  try {
    path = new URL(url).pathname
  } catch {
    return null
  }
  return BY_PATH.find(([rule]) => rule.test(path))?.[1] ?? null
}
