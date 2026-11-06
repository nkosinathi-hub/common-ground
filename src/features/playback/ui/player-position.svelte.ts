import { untrack } from "svelte"
import type { ProgressReporter } from "../application/progress-reporter"
import { trackPlayback } from "./track-playback"

/** The media position and reporting subscription belong to the current video element. */
export class PlayerPosition {
  time = $state(0)
  ended = $state(false)
  paused = $state(true)
  constructor(video: () => HTMLVideoElement | null, reporter: () => ProgressReporter | null) {
    $effect(() => {
      const element = video()
      const report = untrack(reporter)
      this.time = element?.currentTime ?? 0
      this.ended = false
      if (!element || !report) return
      const update = () => {
        this.time = element.currentTime
        this.ended = element.ended
        this.paused = element.paused
      }
      element.addEventListener("timeupdate", update)
      element.addEventListener("ended", update)
      element.addEventListener("play", update)
      element.addEventListener("pause", update)
      const detach = trackPlayback(element, report)
      return () => {
        element.removeEventListener("timeupdate", update)
        element.removeEventListener("ended", update)
        element.removeEventListener("play", update)
        element.removeEventListener("pause", update)
        detach()
      }
    })
  }
}
