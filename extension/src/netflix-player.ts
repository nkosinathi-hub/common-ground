import type { PlayerControl } from "@/features/parties/application/ports"
import { NETFLIX_ORIGIN } from "@/features/parties/domain/netflix"
import { parseSeekReply, seekRequest } from "./bridge"
import type { MessageWindow } from "./page-seek"

/** What the adapter uses of Netflix's <video>. */
export interface NetflixVideo {
  play(): Promise<void>
  pause(): void
  readonly currentTime: number
  playbackRate: number
}

/** The watch page: its current video (Netflix swaps it per episode) and its media events. */
export interface VideoPage {
  video(): NetflixVideo | null
  on(type: "waiting" | "playing", listener: () => void): () => void
}

/** The real page: media events do not bubble, so they are caught on the way down. */
export const videoPage = (doc: Document): VideoPage => ({
  video: () => doc.querySelector("video"),
  on(type, listener) {
    doc.addEventListener(type, listener, true)
    return () => doc.removeEventListener(type, listener, true)
  },
})

/** Sends seeks to the page script; calls onFailed when the page could not make one. */
export function pageSeeker(win: MessageWindow, onFailed: () => void): (ms: number) => void {
  let next = 0
  win.addEventListener("message", (event) => {
    const reply = parseSeekReply(event, win)
    if (reply && !reply.ok) onFailed()
  })
  return (ms) => win.postMessage(seekRequest(++next, ms), NETFLIX_ORIGIN)
}

/**
 * The party's PlayerControl over the member's own Netflix player: play, pause, position, rate
 * and buffering through the page's video, and seeks through Netflix's player API (page-seek.ts).
 */
export function netflixPlayer(page: VideoPage, seekMs: (ms: number) => void): PlayerControl {
  return {
    play: () => page.video()?.play() ?? Promise.reject(new Error("No Netflix video on this page")),
    pause: () => page.video()?.pause(),
    seek: (seconds) => seekMs(seconds * 1000),
    setRate: (rate) => {
      const video = page.video()
      if (video) video.playbackRate = rate
    },
    currentTime: () => page.video()?.currentTime ?? 0,
    onBuffering(listener) {
      const stops = [
        page.on("waiting", () => listener(true)),
        page.on("playing", () => listener(false)),
      ]
      return () => stops.forEach((stop) => stop())
    },
  }
}
