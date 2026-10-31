import { getContext, setContext } from "svelte"
import type { PlaybackService } from "../application/playback-service"
import type { EpisodeNumber, PlaybackCatalog, PlayTarget } from "../application/ports"
import { PlayState } from "./play-state.svelte"
import { WatchChoices } from "./watch-choices.svelte"

const TRAILER = ["youtube-trailer"]

/**
 * One title's playback, shared by its play button, episode picker, trailer button and player:
 * the next episode from your place, any other episode, or the trailer.
 */
export class TitlePlayback {
  readonly choices: WatchChoices
  readonly play: PlayState
  mode = $state<"title" | "trailer">("title")
  /** Where your place says to carry on; the picker marks everything before it watched. */
  next = $state<EpisodeNumber | null>(null)

  constructor(
    catalog: PlaybackCatalog,
    service: PlaybackService,
    readonly target: () => PlayTarget,
    private readonly onwatched: () => void = () => {},
  ) {
    this.choices = new WatchChoices(catalog, service)
    this.play = new PlayState(service, target)
  }

  get episodic(): boolean {
    return this.target().catalog.type === "tv"
  }

  get nextName(): string | null {
    if (!this.next || this.choices.selectedSeason !== this.next.season) return null
    return this.choices.episodes.find((e) => e.number === this.next!.episode)?.name ?? null
  }

  async load(): Promise<void> {
    await this.choices.load(this.target())
    if (this.episodic)
      this.next = { season: this.choices.selectedSeason, episode: this.choices.selectedEpisode }
  }

  /** Plays the next episode, or the film. */
  playNext = () => this.playEpisode(this.episodic ? (this.next ?? undefined) : undefined)

  async playEpisode(episode?: EpisodeNumber): Promise<void> {
    this.mode = "title"
    if (episode) this.choices.selectedEpisode = episode.episode
    await this.play.open(episode, undefined, { excludeProviderIds: TRAILER })
  }

  async playTrailer(): Promise<void> {
    this.mode = "trailer"
    const episode = this.next ?? undefined
    await this.play.open(this.episodic ? episode : undefined, undefined, { providerIds: TRAILER })
  }

  /** The player moved on by itself: the next episode, crossing into the next season if needed. */
  async continueTo(next: EpisodeNumber): Promise<void> {
    if (next.season !== this.choices.selectedSeason)
      await this.choices.selectSeason(this.target(), next.season, next.episode)
    await this.playEpisode(next)
  }

  async watched(): Promise<void> {
    this.onwatched()
    await this.choices.refreshSuggested(this.target())
    if (this.episodic)
      this.next = { season: this.choices.selectedSeason, episode: this.choices.selectedEpisode }
  }

  cancel = () => this.choices.cancel()
}

const KEY = Symbol("title-playback")
export const provideTitlePlayback = (value: TitlePlayback) => setContext(KEY, value)
export const useTitlePlayback = () => getContext<TitlePlayback | undefined>(KEY)
