import type { MediaRef } from "../domain/media-ref"
import type { PlayableSource } from "../domain/source.types"

export interface Playing {
  readonly ref: MediaRef
  /** Best first; the player moves down the list when a source fails. */
  readonly sources: readonly PlayableSource[]
}
