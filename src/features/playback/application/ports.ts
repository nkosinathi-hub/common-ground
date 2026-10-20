import type { Result } from "../../../shared/domain/result"
import type { MediaRef } from "../domain/media-ref"

export type {
  Credential,
  CredentialStore,
  LogEntry,
  PlaybackLog,
  TmdbLookup,
  Trailer,
} from "../domain/plugin.types"

/** A watch-list title to play: its space item and its TMDB identity. */
export interface PlayTarget {
  readonly spaceId: string
  readonly itemId: string
  readonly catalog: { readonly type: "movie" | "tv"; readonly id: number }
}

export interface EpisodeNumber {
  readonly season: number
  readonly episode: number
}

export interface NextUp extends EpisodeNumber {
  readonly title: string
}

/**
 * What the player needs from the rest of the app. The episode-history data model is built by
 * another stream; until it lands, composition supplies interim implementations.
 */
export interface PlaybackPorts {
  /** Where this person is in a series: the episode to play now, or null to start at S1E1. */
  nextEpisode(target: PlayTarget): Promise<Result<EpisodeNumber | null>>
  /** The episode after this one, for the play-next countdown (Jellyfin NextUp when signed in). */
  nextUp(target: PlayTarget, current: MediaRef): Promise<Result<NextUp | null>>
  /** Called once 90 percent has played. */
  markWatched(target: PlayTarget, ref: MediaRef): Promise<Result<void>>
}
