import type { PlayerControl } from "@/features/parties"

import { partyVideo } from "./party-video"

/**
 * The video the in-app player is showing, handed to watch parties. Playback and parties never
 * import each other; this bridge in composition is their only link.
 */
export class ActivePlayer {
  private current: { video: HTMLVideoElement; control: PlayerControl } | null = null

  /** The player calls this when its video element appears; the result detaches it. */
  attach(video: HTMLVideoElement): () => void {
    const entry = { video, control: partyVideo(video) }
    this.current = entry
    return () => {
      if (this.current === entry) this.current = null
    }
  }

  control = (): PlayerControl | null => this.current?.control ?? null
}
