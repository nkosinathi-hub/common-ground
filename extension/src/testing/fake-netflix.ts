import type { BridgeEvent } from "../bridge"

type Listener = (event: BridgeEvent) => void

/** Netflix's <video>: plays in real time (Date.now); setting currentTime breaks Netflix. */
class FakeNetflixVideo {
  playing = false
  playbackRate = 1
  /** Set when anything assigns currentTime, which Netflix answers with an error (M7375). */
  broken = false
  private position = 0
  private since = Date.now()

  settle(): void {
    const now = Date.now()
    if (this.playing) this.position += ((now - this.since) / 1000) * this.playbackRate
    this.since = now
  }

  get currentTime(): number {
    this.settle()
    return this.position
  }

  set currentTime(_seconds: number) {
    this.broken = true
  }

  /** What Netflix's own player API does on seek(ms). */
  seekTo(seconds: number): void {
    this.settle()
    this.position = seconds
  }

  play(): Promise<void> {
    this.settle()
    this.playing = true
    return Promise.resolve()
  }

  pause(): void {
    this.settle()
    this.playing = false
  }
}

/** A netflix.com watch page: its window (postMessage, the player API) and its video. */
export function fakeNetflixPage(sessionIds = ["watch-1"]) {
  const video = new FakeNetflixVideo()
  const seeks: number[] = []
  const listeners = new Set<Listener>()
  const videoPlayer = {
    getAllPlayerSessionIds: () => sessionIds,
    getVideoPlayerBySessionId: (id: string) =>
      id === "watch-1" ? { seek: (ms: number) => (seeks.push(ms), video.seekTo(ms / 1000)) } : null,
  }
  const win = {
    netflix: { appContext: { state: { playerApp: { getAPI: () => ({ videoPlayer }) } } } },
    posted: [] as { message: unknown; origin: string }[],
    addEventListener: (_type: "message", listener: Listener) => void listeners.add(listener),
    removeEventListener: (_type: "message", listener: Listener) => void listeners.delete(listener),
    postMessage(message: unknown, origin: string) {
      win.posted.push({ message, origin })
      if (origin !== "https://www.netflix.com") return
      const event = { data: structuredClone(message), origin, source: win }
      for (const listener of [...listeners]) listener(event)
    },
  }
  const media = new EventTarget()
  const page = {
    video: () => video,
    on(type: "waiting" | "playing", listener: () => void) {
      media.addEventListener(type, listener)
      return () => media.removeEventListener(type, listener)
    },
  }
  const emit = (type: "waiting" | "playing") => media.dispatchEvent(new Event(type))
  return { win, page, video, seeks, emit, listeners }
}
