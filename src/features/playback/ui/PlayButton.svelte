<script lang="ts">
  import { untrack } from "svelte"
  import type { EpisodeNumber, PlaybackCatalog, PlayTarget } from "../application/ports"
  import { usePlayback } from "./context"
  import { PlayState } from "./play-state.svelte"
  import { WatchChoices } from "./watch-choices.svelte"
  import PlaybackOptions from "./PlaybackOptions.svelte"
  import Player from "./Player.svelte"

  interface Props {
    target: PlayTarget
    title: string
    catalog: PlaybackCatalog
    onwatched?: () => void
  }

  let { target, title, catalog, onwatched }: Props = $props()
  const { service, account } = usePlayback()
  const choices = untrack(() => new WatchChoices(catalog, service))
  const play = new PlayState(service, () => target)
  let mode = $state<"title" | "trailer">("title")
  const episodic = $derived(target.catalog.type === "tv")
  const label = $derived(
    episodic ? `Watch S${choices.selectedSeason} E${choices.selectedEpisode}` : "Watch movie",
  )

  $effect(() => {
    const current = target
    void choices.load(current)
    return () => choices.cancel()
  })

  function episode(): EpisodeNumber | undefined {
    return episodic
      ? { season: choices.selectedSeason, episode: choices.selectedEpisode }
      : undefined
  }

  async function watchTitle(): Promise<void> {
    mode = "title"
    await play.open(episode(), undefined, { excludeProviderIds: ["youtube-trailer"] })
  }

  async function watchTrailer(): Promise<void> {
    mode = "trailer"
    await play.open(episode(), undefined, { providerIds: ["youtube-trailer"] })
  }

  async function playNext(next: EpisodeNumber): Promise<void> {
    if (episodic && next.season !== choices.selectedSeason)
      await choices.selectSeason(target, next.season, next.episode)
    else choices.selectedEpisode = next.episode
    await play.open(next, undefined, { excludeProviderIds: ["youtube-trailer"] })
  }

  async function watched(): Promise<void> {
    onwatched?.()
    await choices.refreshSuggested(target)
  }
</script>

<section aria-label="Watch here" class="space-y-3">
  <PlaybackOptions
    {episodic}
    seasons={choices.seasons}
    episodes={choices.episodes}
    selectedSeason={choices.selectedSeason}
    selectedEpisode={choices.selectedEpisode}
    trailerAvailable={choices.trailerAvailable}
    detailsLoading={choices.detailsLoading}
    seasonLoading={choices.seasonLoading}
    error={choices.error || play.error?.message || ""}
    {mode}
    {label}
    loading={play.status === "loading"}
    {account}
    onseason={(season) => void choices.selectSeason(target, season)}
    onepisode={(selected) => (choices.selectedEpisode = selected)}
    ontitle={() => void watchTitle()}
    ontrailer={() => void watchTrailer()}
  />
  {#if play.status === "ready" && play.playing}
    <Player
      playing={play.playing}
      {target}
      {title}
      onclose={() => play.close()}
      onnext={(next) => void playNext(next)}
      onwatched={() => void watched()}
    />
  {/if}
</section>
