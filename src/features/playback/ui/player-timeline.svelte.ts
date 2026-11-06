import type { PlaybackService, Playing } from "../application/playback-service"
import type { NextUp, PlayTarget } from "../application/ports"
import type { Segment } from "../domain/source.types"

/** Timing metadata loads beside playback; late answers cannot affect the following episode. */
export class PlayerTimeline {
  next = $state<NextUp | null>(null)
  segments = $state<readonly Segment[]>([])
  constructor(service: PlaybackService, target: PlayTarget, playing: Playing, preview = false) {
    $effect(() => {
      if (preview) return
      const controller = new AbortController()
      void service.nextUp(target, playing.ref).then((r) => {
        if (!controller.signal.aborted) this.next = r.ok ? r.value : null
      })
      void service.segments(playing.ref, controller.signal).then((segments) => {
        if (!controller.signal.aborted) this.segments = segments
      })
      return () => controller.abort()
    })
  }
}
