import type { PlayerControl } from "@/features/parties"

/** Native controls send user intent; changes applied by the session never echo back. */
export function partyVideo(video: HTMLVideoElement): PlayerControl {
  const expected = { play: 0, pause: 0 }
  let expectedSeek: number | null = null
  let pending: number | null = null
  const seek = (seconds: number) => {
    if (!Number.isFinite(seconds)) return
    const duration = Number.isFinite(video.duration) ? video.duration : Infinity
    const to = Math.max(0, Math.min(seconds, duration))
    pending = null
    if (Math.abs(video.currentTime - to) < 0.05) return
    expectedSeek = to
    try {
      video.currentTime = to
      pending = video.readyState === 0 ? to : null
    } catch {
      pending = to // Some engines cannot seek until metadata is available.
    }
  }
  return {
    play: async () => {
      if (video.paused) expected.play += 1
      try {
        await video.play()
      } catch (error) {
        expected.play = Math.max(0, expected.play - 1)
        throw error
      }
    },
    pause: () => {
      if (!video.paused) expected.pause += 1
      video.pause()
    },
    seek,
    setRate: (rate) => {
      video.playbackRate = rate
    },
    currentTime: () => video.currentTime,
    isReady: () => video.readyState >= 2 && !video.error,
    onAction: (listener) => {
      const playback = (event: Event) => {
        const action = event.type === "play" ? "play" : "pause"
        if (expected[action]) {
          expected[action] -= 1
          return
        }
        if (!video.ended) listener(action, video.currentTime)
      }
      const sought = () => {
        if (expectedSeek !== null && Math.abs(video.currentTime - expectedSeek) < 0.5) {
          expectedSeek = null
          return
        }
        expectedSeek = null
        listener("seek", video.currentTime)
      }
      video.addEventListener("play", playback)
      video.addEventListener("pause", playback)
      video.addEventListener("seeked", sought)
      return () => {
        video.removeEventListener("play", playback)
        video.removeEventListener("pause", playback)
        video.removeEventListener("seeked", sought)
      }
    },
    onBuffering: (listener) => {
      const waiting = () => listener(true)
      const ready = (event: Event) => {
        if (pending !== null) seek(pending)
        if (event.type !== "loadedmetadata" || video.readyState >= 3) listener(false)
      }
      video.addEventListener("waiting", waiting)
      video.addEventListener("playing", ready)
      video.addEventListener("canplay", ready)
      video.addEventListener("loadedmetadata", ready)
      return () => {
        video.removeEventListener("waiting", waiting)
        video.removeEventListener("playing", ready)
        video.removeEventListener("canplay", ready)
        video.removeEventListener("loadedmetadata", ready)
      }
    },
  }
}
