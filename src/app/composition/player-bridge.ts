import type { PlayerControl } from "@/features/parties"

/** A media element as a party's PlayerControl: the sync engine plays, seeks and nudges it. */
function controlOf(video: HTMLVideoElement): PlayerControl {
  return {
    play: () => video.play(),
    pause: () => video.pause(),
    seek: (seconds) => void (video.currentTime = seconds),
    setRate: (rate) => void (video.playbackRate = rate),
    currentTime: () => video.currentTime,
    onBuffering: (listener) => {
      const waiting = () => listener(true)
      const playing = () => listener(false)
      video.addEventListener("waiting", waiting)
      video.addEventListener("playing", playing)
      return () => {
        video.removeEventListener("waiting", waiting)
        video.removeEventListener("playing", playing)
      }
    },
  }
}

/**
 * The video the in-app player is showing, handed to watch parties. Playback and parties never
 * import each other; this bridge in composition is their only link.
 */
export class ActivePlayer {
  private current: { video: HTMLVideoElement; control: PlayerControl } | null = null

  /** The player calls this when its video element appears; the result detaches it. */
  attach(video: HTMLVideoElement): () => void {
    const entry = { video, control: controlOf(video) }
    this.current = entry
    return () => {
      if (this.current === entry) this.current = null
    }
  }

  control = (): PlayerControl | null => this.current?.control ?? null
}
