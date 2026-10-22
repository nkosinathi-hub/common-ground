import type { PlayableSource } from "../domain/source.types"

export type Engine = "shaka" | "video" | "embed"

/**
 * shaka-player for HLS and DASH, and for any file that needs headers (a <video> element cannot
 * send them); a sandboxed iframe for embeds; the native element for plain files.
 */
export function engineFor(source: PlayableSource): Engine {
  if (source.kind === "embed") return "embed"
  if (source.kind === "file" && !source.requestHeaders) return "video"
  return "shaka"
}

/** The source's own headers, only for requests to the source's own origin. */
export function headersFor(source: PlayableSource, uri: string): Record<string, string> {
  if (!source.requestHeaders) return {}
  try {
    return new URL(uri).origin === new URL(source.url).origin ? { ...source.requestHeaders } : {}
  } catch {
    return {}
  }
}

const MEDIA_TYPE =
  /^(video|audio)\/|^application\/(mp4|octet-stream)|^binary\/octet-stream|^text\/vtt/i

/**
 * A segment's declared type is advisory: a host that hides media behind .html names answers
 * text/html, which shaka would hand to Media Source Extensions as it is. Anything but a media
 * type is taken as a transport stream, the HLS container when no init segment is declared;
 * shaka's own byte probe cannot see through AES-128, so it is no use here.
 */
export function segmentContentType(declared: string | undefined): string {
  return declared && MEDIA_TYPE.test(declared) ? declared : "video/mp2t"
}

export type KeyAction = "toggle" | "back" | "forward" | "fullscreen" | "captions" | "mute"

const KEYS: Record<string, KeyAction> = {
  " ": "toggle",
  k: "toggle",
  j: "back",
  l: "forward",
  f: "fullscreen",
  c: "captions",
  m: "mute",
}

/** Player shortcuts: space or k, j and l (10 s), f, c and m. */
export function keyAction(key: string): KeyAction | null {
  return KEYS[key.length === 1 ? key.toLowerCase() : key] ?? null
}
