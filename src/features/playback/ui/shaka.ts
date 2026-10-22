import type { PlayableSource } from "../domain/source.types"
import { headersFor, segmentContentType } from "./player-logic"

export interface EngineHandle {
  setCaptions(on: boolean, language: string | null): void
  destroy(): void
}

/**
 * Loads shaka-player on demand (its own chunk) for HLS, DASH and header-carrying files. Tokens
 * reach the server only as headers, through a request filter limited to the source's origin.
 */
export async function attachShaka(
  video: HTMLVideoElement,
  source: PlayableSource,
  onError: () => void,
): Promise<EngineHandle> {
  const { default: shaka } = await import("shaka-player")
  shaka.polyfill.installAll()
  const none = { setCaptions: () => {}, destroy: () => {} }
  if (!shaka.Player.isBrowserSupported()) {
    onError()
    return none
  }
  const player = new shaka.Player()
  await player.attach(video)
  const engine = player.getNetworkingEngine()
  engine?.registerRequestFilter((_type, request) => {
    Object.assign(request.headers, headersFor(source, request.uris[0] ?? ""))
  })
  engine?.registerResponseFilter((type, response) => {
    if (type !== shaka.net.NetworkingEngine.RequestType.SEGMENT) return
    response.headers["content-type"] = segmentContentType(response.headers["content-type"])
  })
  player.addEventListener("error", onError)
  try {
    const mime = source.kind === "file" ? (source.mime ?? "video/mp4") : null
    await player.load(source.url, source.resumeSeconds ?? null, mime)
    for (const track of source.subtitles)
      await player.addTextTrackAsync(
        track.url,
        track.language,
        "subtitles",
        "text/vtt",
        undefined,
        track.label,
      )
  } catch {
    onError()
  }
  return {
    setCaptions: (on, language) => {
      const tracks = player.getTextTracks()
      const track = tracks.find((t) => t.language === language) ?? tracks[0] ?? null
      player.selectTextTrack(on ? track : null)
    },
    destroy: () => void player.destroy(),
  }
}
