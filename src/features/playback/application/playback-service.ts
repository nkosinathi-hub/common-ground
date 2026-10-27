import { appError, err, ok, type Result } from "../../../shared/domain/result"
import { episodeRef, movieRef, type MediaRef } from "../domain/media-ref"
import type { PlaybackPrefs } from "../domain/provider.types"
import type { PlayableSource } from "../domain/source.types"
import type { EpisodeNumber, NextUp, PlaybackPorts, PlayTarget } from "./ports"
import { ProgressReporter } from "./progress-reporter"
import type { SourceResolver } from "./source-resolver"

type Resolver = Pick<SourceResolver, "resolve" | "providerFor">

export interface Playing {
  readonly ref: MediaRef
  /** Best first; the player moves down the list when a source fails. */
  readonly sources: readonly PlayableSource[]
}

export interface ProviderSelection {
  readonly providerIds?: readonly string[]
  readonly excludeProviderIds?: readonly string[]
}

/** The player's use cases: what to play for a title, what comes next, and progress. */
export class PlaybackService {
  constructor(
    private readonly resolver: Resolver,
    private readonly ports: PlaybackPorts,
    private readonly clock: () => number = () => Date.now(),
  ) {}

  private async refFor(target: PlayTarget, episode?: EpisodeNumber): Promise<Result<MediaRef>> {
    const { type, id } = target.catalog
    if (type === "movie") return movieRef(id)
    if (episode) return episodeRef(id, episode.season, episode.episode)
    const next = await this.ports.nextEpisode(target)
    if (!next.ok) return next
    return episodeRef(id, next.value?.season ?? 1, next.value?.episode ?? 1)
  }

  /** The next episode to start: last watched progress advances through its episode list. */
  async suggestedEpisode(target: PlayTarget): Promise<Result<EpisodeNumber>> {
    if (target.catalog.type !== "tv")
      return err(appError("validation", "This title has no episodes"))
    const next = await this.ports.nextEpisode(target)
    return next.ok ? ok(next.value ?? { season: 1, episode: 1 }) : next
  }

  /** A movie, or this person's next episode unless one is chosen. A track change calls again. */
  async play(
    target: PlayTarget,
    episode?: EpisodeNumber,
    prefs?: PlaybackPrefs,
    signal?: AbortSignal,
    selection?: ProviderSelection,
  ): Promise<Result<Playing>> {
    const ref = await this.refFor(target, episode)
    if (!ref.ok) return ref
    const options = {
      ...(signal ? { signal } : {}),
      ...(prefs ? { prefs } : {}),
      ...(selection?.providerIds ? { providerIds: selection.providerIds } : {}),
      ...(selection?.excludeProviderIds
        ? { excludeProviderIds: selection.excludeProviderIds }
        : {}),
    }
    const resolved = await this.resolver.resolve(ref.value, options)
    if (!resolved.ok) return resolved
    return ok({ ref: ref.value, sources: [resolved.value.best, ...resolved.value.fallbacks] })
  }

  async nextUp(target: PlayTarget, current: MediaRef): Promise<Result<NextUp | null>> {
    if (current.kind !== "episode") return ok(null)
    return this.ports.nextUp(target, current)
  }

  reporter(
    source: PlayableSource,
    target: PlayTarget,
    ref: MediaRef,
    onWatched?: () => void,
  ): ProgressReporter {
    const provider = this.resolver.providerFor(source)
    return new ProgressReporter({
      source,
      ...(provider ? { provider } : {}),
      watched: () => this.ports.markWatched(target, ref),
      ...(onWatched ? { onWatched } : {}),
      clock: this.clock,
    })
  }
}
