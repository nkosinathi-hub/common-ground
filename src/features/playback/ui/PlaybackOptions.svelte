<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Label } from "$lib/components/ui/label"
  import type { PlaybackEpisode, PlaybackSeason, ProviderAccount } from "../application/ports"
  import MediaServerSignIn from "./MediaServerSignIn.svelte"

  interface Props {
    episodic: boolean
    seasons: readonly PlaybackSeason[]
    episodes: readonly PlaybackEpisode[]
    selectedSeason: number
    selectedEpisode: number
    trailerAvailable: boolean
    detailsLoading: boolean
    seasonLoading: boolean
    error: string
    mode: "title" | "trailer"
    label: string
    loading: boolean
    account: ProviderAccount | null
    onseason: (season: number) => void
    onepisode: (episode: number) => void
    ontitle: () => void
    ontrailer: () => void
  }

  let props: Props = $props()
</script>

<div class="space-y-3 rounded-xl border bg-card p-4">
  <div class="flex flex-wrap gap-2" aria-label="Choose what to watch">
    <Button
      variant={props.mode === "title" ? "default" : "outline"}
      onclick={props.ontitle}
      disabled={props.loading}
    >
      {props.label}
    </Button>
    {#if props.trailerAvailable}
      <Button
        variant={props.mode === "trailer" ? "default" : "outline"}
        onclick={props.ontrailer}
        disabled={props.loading}
      >
        Watch trailer
      </Button>
    {/if}
    {#if props.account}<MediaServerSignIn account={props.account} />{/if}
  </div>
  {#if props.episodic}
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="grid gap-1.5">
        <Label for="play-season">Season</Label>
        <select
          id="play-season"
          class="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={props.selectedSeason}
          disabled={props.detailsLoading || props.seasonLoading || props.seasons.length === 0}
          onchange={(event) => props.onseason(Number(event.currentTarget.value))}
        >
          {#each props.seasons as season (season.number)}
            <option value={season.number}>{season.name} · {season.episodeCount} episodes</option>
          {/each}
          {#if props.seasons.length === 0}<option value={props.selectedSeason}
              >Season {props.selectedSeason}</option
            >{/if}
        </select>
      </div>
      <div class="grid gap-1.5">
        <Label for="play-episode">Episode</Label>
        <select
          id="play-episode"
          class="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={props.selectedEpisode}
          disabled={props.detailsLoading || props.seasonLoading || props.episodes.length === 0}
          onchange={(event) => props.onepisode(Number(event.currentTarget.value))}
        >
          {#each props.episodes as episode (episode.number)}
            <option value={episode.number}>Episode {episode.number} · {episode.name}</option>
          {/each}
          {#if props.episodes.length === 0}<option value={props.selectedEpisode}
              >Choose an episode</option
            >{/if}
        </select>
      </div>
    </div>
    <p class="text-xs text-muted-foreground">
      Your next episode is selected automatically. Choose any season or episode here.
    </p>
  {/if}
  {#if props.detailsLoading || props.seasonLoading}
    <p class="text-sm text-muted-foreground">
      Loading {props.seasonLoading ? "episodes" : "watch options"}…
    </p>
  {/if}
  {#if props.error}<p class="text-sm text-destructive" role="alert">{props.error}</p>{/if}
  {#if props.loading}<p class="text-sm text-muted-foreground" role="status">
      Finding a source…
    </p>{/if}
</div>
