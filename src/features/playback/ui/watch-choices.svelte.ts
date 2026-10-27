import type { PlaybackService } from "../application/playback-service"
import type {
  PlaybackCatalog,
  PlaybackEpisode,
  PlaybackSeason,
  PlayTarget,
} from "../application/ports"

/** Catalog-backed season choices paired with this member's automatically suggested episode. */
export class WatchChoices {
  seasons = $state<PlaybackSeason[]>([])
  episodes = $state<PlaybackEpisode[]>([])
  selectedSeason = $state(1)
  selectedEpisode = $state(1)
  trailerAvailable = $state(false)
  detailsLoading = $state(false)
  seasonLoading = $state(false)
  error = $state("")
  private generation = 0

  constructor(
    private readonly catalog: PlaybackCatalog,
    private readonly playback: PlaybackService,
  ) {}

  async load(target: PlayTarget): Promise<void> {
    const generation = ++this.generation
    this.detailsLoading = true
    this.error = ""
    const [details, suggested] = await Promise.all([
      this.catalog.details(target.spaceId, target.catalog.type, target.catalog.id),
      target.catalog.type === "tv" ? this.playback.suggestedEpisode(target) : Promise.resolve(null),
    ])
    if (generation !== this.generation) return
    this.detailsLoading = false
    if (!details.ok) {
      this.trailerAvailable = false
      this.seasons = []
      if (target.catalog.type === "tv") this.error = details.error.message
      return
    }
    this.trailerAvailable = details.value.trailerAvailable
    this.seasons = details.value.seasons.filter((season) => season.number > 0)
    if (target.catalog.type !== "tv") return
    const preferred = suggested?.ok ? suggested.value : { season: 1, episode: 1 }
    const season = this.seasons.some((entry) => entry.number === preferred.season)
      ? preferred.season
      : (this.seasons[0]?.number ?? 1)
    await this.loadSeason(target, season, preferred.season === season ? preferred.episode : 1)
  }

  async selectSeason(target: PlayTarget, season: number, episode = 1): Promise<void> {
    await this.loadSeason(target, season, episode)
  }

  async refreshSuggested(target: PlayTarget): Promise<void> {
    if (target.catalog.type !== "tv") return
    const suggested = await this.playback.suggestedEpisode(target)
    if (!suggested.ok) return
    if (suggested.value.season !== this.selectedSeason || this.episodes.length === 0) {
      await this.loadSeason(target, suggested.value.season, suggested.value.episode)
    } else if (this.episodes.some((episode) => episode.number === suggested.value.episode)) {
      this.selectedEpisode = suggested.value.episode
    }
  }

  cancel(): void {
    this.generation++
  }

  private async loadSeason(
    target: PlayTarget,
    season: number,
    preferredEpisode: number,
  ): Promise<void> {
    const generation = ++this.generation
    this.selectedSeason = season
    this.seasonLoading = true
    this.error = ""
    this.episodes = []
    const result = await this.catalog.season(target.spaceId, target.catalog.id, season)
    if (generation !== this.generation) return
    this.seasonLoading = false
    if (!result.ok) {
      this.error = result.error.message
      return
    }
    this.episodes = [...result.value.episodes]
    this.selectedEpisode = this.episodes.some((episode) => episode.number === preferredEpisode)
      ? preferredEpisode
      : (this.episodes[0]?.number ?? 1)
  }
}
