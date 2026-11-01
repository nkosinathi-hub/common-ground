import { untrack } from "svelte"
import type { ProgressReporter } from "../application/progress-reporter"
import { trackPlayback } from "./track-playback"

/** The media position and reporting subscription belong to the current video element. */
export class PlayerPosition {
  time = $state(0)
  ended = $state(false)
  constructor(video: () => HTMLVideoElement | null, reporter: () => ProgressReporter | null) {
    $effect(() => {
      const element = video()
      const report = untrack(reporter)
      if (!element || !report) return
      const update = () => {
        this.time = element.currentTime
        this.ended = element.ended
      }
      element.addEventListener("timeupdate", update)
      element.addEventListener("ended", update)
      const detach = trackPlayback(element, report)
      return () => {
        element.removeEventListener("timeupdate", update)
        element.removeEventListener("ended", update)
        detach()
      }
    })
  }
}
