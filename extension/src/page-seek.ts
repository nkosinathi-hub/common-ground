import { NETFLIX_ORIGIN } from "@/features/parties/domain/netflix"
import { parseSeekRequest, seekReply, type BridgeEvent } from "./bridge"

/** A window the bridge talks over: the page's own, as the MAIN-world script sees it. */
export interface MessageWindow {
  addEventListener(type: "message", listener: (event: BridgeEvent) => void): void
  removeEventListener(type: "message", listener: (event: BridgeEvent) => void): void
  postMessage(message: unknown, targetOrigin: string): void
}

interface SeekableSession {
  seek(ms: number): void
}

interface NetflixVideoPlayer {
  getAllPlayerSessionIds(): string[]
  getVideoPlayerBySessionId(id: string): SeekableSession | null | undefined
}

type NetflixWindow = {
  netflix?: { appContext?: { state?: { playerApp?: { getAPI?: () => unknown } } } | null }
}

/**
 * Seeks with Netflix's own page player API, the way Teleparty does: setting the video's
 * currentTime directly breaks Netflix's player. Playback only; no media or DRM is touched.
 */
export function seekNetflix(win: unknown, ms: number): boolean {
  try {
    const api = (win as NetflixWindow).netflix?.appContext?.state?.playerApp?.getAPI?.()
    const videoPlayer = (api as { videoPlayer?: NetflixVideoPlayer } | undefined)?.videoPlayer
    const ids = videoPlayer?.getAllPlayerSessionIds() ?? []
    const id = ids.find((s) => s.startsWith("watch")) ?? ids[0]
    const session = id === undefined ? null : videoPlayer?.getVideoPlayerBySessionId(id)
    if (!session) return false
    session.seek(ms)
    return true
  } catch {
    return false
  }
}

/** Answers the content script's seek requests; returns a function that stops listening. */
export function installSeekHandler(win: MessageWindow): () => void {
  const onMessage = (event: BridgeEvent) => {
    const request = parseSeekRequest(event, win)
    if (!request) return
    win.postMessage(seekReply(request.id, seekNetflix(win, request.ms)), NETFLIX_ORIGIN)
  }
  win.addEventListener("message", onMessage)
  return () => win.removeEventListener("message", onMessage)
}
