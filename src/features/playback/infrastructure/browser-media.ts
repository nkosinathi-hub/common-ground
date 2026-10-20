import type { PlayableSource } from "../domain/source.types"

interface MseLike {
  isTypeSupported(type: string): boolean
}

/** MediaSource, or ManagedMediaSource on iOS 17.1+, which shaka-player also drives. */
function mediaSource(): MseLike | null {
  const scope = globalThis as { MediaSource?: MseLike; ManagedMediaSource?: MseLike }
  return scope.MediaSource ?? scope.ManagedMediaSource ?? null
}

function elementCanPlay(type: string): boolean {
  if (typeof document === "undefined") return false
  return document.createElement("video").canPlayType(type) !== ""
}

/** Whether this browser or WebView decodes a MIME type with codecs (for Jellyfin's profile). */
export function browserProbe(type: string): boolean {
  const mse = mediaSource()
  return mse ? mse.isTypeSupported(type) : elementCanPlay(type)
}

/**
 * Device capability for ranking: embeds always, HLS and DASH through shaka-player on MSE (or
 * native HLS on Safari), files when the element can decode their type.
 */
export function browserCanPlay(source: PlayableSource): boolean {
  if (source.kind === "embed") return true
  if (mediaSource()) return true
  if (source.kind === "hls") return elementCanPlay("application/vnd.apple.mpegurl")
  if (source.kind === "dash") return false
  return elementCanPlay(source.mime ?? "video/mp4")
}
