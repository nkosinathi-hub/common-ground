import type { EpisodeRange } from "../domain/episode-range"
import type { PartySource, StartParty } from "../domain/party"

/** The "Watch together" form: where you will watch, and which episodes. */
export class StartFormState {
  source = $state<PartySource>("jellyfin")
  fromSeason = $state(1)
  fromEpisode = $state(1)
  toSeason = $state(1)
  toEpisode = $state(1)
  /** Episodes in each season the range leaves, by season number. */
  counts = $state<Record<number, number>>({})

  reset(range: EpisodeRange): void {
    this.fromSeason = range.from.season
    this.fromEpisode = range.from.episode
    this.toSeason = range.to.season
    this.toEpisode = range.to.episode
    this.counts = {}
  }

  /** The seasons the range runs past the end of, which need their episode counts. */
  get seasonsLeft(): number[] {
    const seasons: number[] = []
    for (let s = this.fromSeason; s < this.toSeason; s++) seasons.push(s)
    return seasons
  }

  toInput(watchItemId: string, isFilm: boolean): StartParty {
    if (isFilm) return { watchItemId, source: this.source, range: null }
    const range = {
      from: { season: this.fromSeason, episode: this.fromEpisode },
      to: { season: this.toSeason, episode: this.toEpisode },
    }
    const left = this.seasonsLeft
    return {
      watchItemId,
      source: this.source,
      range: left.length
        ? { ...range, seasonEpisodeCounts: left.map((s) => this.counts[s] ?? 0) }
        : range,
    }
  }
}
