import type { PlayableSource } from "../domain/source.types"
import type { CaptionChoice } from "./caption-pref"
export interface PlayerMediaProps {
  loading?: boolean
  autoplay?: boolean
  source: PlayableSource | null
  title: string
  captions: CaptionChoice
  video?: HTMLVideoElement | null
  onfail: () => void
}
