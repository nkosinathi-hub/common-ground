import type { Playing } from "../application/playback-service"
import type { EpisodeNumber, PlayTarget } from "../application/ports"

export interface PlayerProps {
  party?: boolean
  preview?: boolean
  playing: Playing
  target: PlayTarget
  title: string
  onclose: () => void
  onnext: (episode: EpisodeNumber) => void
  onwatched?: () => void
  onretry?: () => void
}
