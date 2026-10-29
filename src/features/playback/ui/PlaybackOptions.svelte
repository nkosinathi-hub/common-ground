<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Play } from "@lucide/svelte"
  import type { PlaybackEpisode, PlaybackSeason, ProviderAccount } from "../application/ports"
  import EpisodeChoice from "./EpisodeChoice.svelte"
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
  const current = $derived(
    props.episodic ? props.episodes.find((e) => e.number === props.selectedEpisode) : undefined,
  )
</script>

<!-- D03a "Next up": what plays next, with a play button, the trailer, and any other episode. -->
<section
  class="flex flex-col gap-stack rounded-lg border border-border bg-card p-card"
  aria-label="Next up"
>
  <div class="flex items-start gap-item">
    <div class="flex min-w-0 flex-1 flex-col gap-hairline">
      <h2 class="type-h3 text-foreground">{current?.name ?? "Watch here"}</h2>
      {#if props.episodic}
        <p class="type-sm text-muted-foreground">
          Next up · S{props.selectedSeason} E{props.selectedEpisode}. Picked from your progress; you
          can choose any episode.
        </p>
      {/if}
    </div>
    <div
      class="flex shrink-0 items-center gap-related"
      aria-label="Choose what to watch"
      role="group"
    >
      {#if props.trailerAvailable}
        <Button
          variant={props.mode === "trailer" ? "secondary" : "outline"}
          aria-label="Watch trailer"
          onclick={props.ontrailer}
          disabled={props.loading}>Trailer</Button
        >
      {/if}
      <Button size="icon" aria-label={props.label} onclick={props.ontitle} disabled={props.loading}
        ><Play /></Button
      >
      {#if props.account}<MediaServerSignIn account={props.account} />{/if}
    </div>
  </div>
  {#if props.episodic}<EpisodeChoice {...props} />{/if}
  {#if props.detailsLoading || props.seasonLoading}
    <p class="type-sm text-muted-foreground">
      Loading {props.seasonLoading ? "episodes" : "watch options"}…
    </p>
  {/if}
  {#if props.error}<p class="type-sm text-destructive" role="alert">{props.error}</p>{/if}
  {#if props.loading}<p class="type-sm text-muted-foreground" role="status">
      Finding a source…
    </p>{/if}
</section>
