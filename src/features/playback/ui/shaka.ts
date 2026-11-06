import type { PlayableSource } from "../domain/source.types"
import { headersFor, segmentContentType } from "./player-logic"
import { shakaTracks } from "./shaka-tracks"
import type { EngineHandle } from "./media-tracks"
export type { EngineHandle } from "./media-tracks"

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
  const none: EngineHandle = {
    tracks: () => ({ audio: [], text: [] }),
    setAudio: () => {},
    setCaptions: () => {},
    addSubtitle: async () => "",
    destroy: () => {},
  }
  if (!shaka.Player.isBrowserSupported()) {
    onError()
    return none
  }
  const player = new shaka.Player()
  player.configure({
    preferredAudioLanguage: "en",
    manifest: { retryParameters: { maxAttempts: 3, timeout: 12000, stallTimeout: 4000 } },
    streaming: {
      bufferingGoal: 30,
      rebufferingGoal: 2,
      bufferBehind: 30,
      retryParameters: { maxAttempts: 3, timeout: 12000, stallTimeout: 4000 },
    },
  })
  await player.attach(video)
  const engine = player.getNetworkingEngine()
  engine?.registerRequestFilter((_type, request) => {
    Object.assign(request.headers, headersFor(source, request.uris[0] ?? ""))
  })
  engine?.registerResponseFilter((type, response) => {
    if (type !== shaka.net.NetworkingEngine.RequestType.SEGMENT) return
    response.headers["content-type"] = segmentContentType(response.headers["content-type"])
  })
  let failed = false
  const fail = () => {
    if (!failed) {
      failed = true
      onError()
    }
  }
  player.addEventListener("error", (event) => {
    const detail = (event as unknown as { detail?: { severity: number; category: number } }).detail
    if (!detail || (detail.severity === 2 && detail.category !== 2)) fail()
  })
  try {
    const mime = source.kind === "file" ? (source.mime ?? "video/mp4") : null
    await player.load(source.url, source.resumeSeconds ?? null, mime)
    for (const track of source.subtitles)
      await player
        .addTextTrackAsync(
          track.url,
          track.language,
          "subtitles",
          "text/vtt",
          undefined,
          track.label,
        )
        .catch(() => {}) // A broken optional subtitle must not discard playable video.
  } catch {
    fail()
  }
  return shakaTracks(player)
}
