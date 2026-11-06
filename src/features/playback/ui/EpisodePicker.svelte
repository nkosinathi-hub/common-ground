<script lang="ts">
  import EpisodeRows from "./EpisodeRows.svelte"
  import { Chip } from "@/shared/ui"
  import type { EpisodeNumber } from "../application/ports"
  import type { TitlePlayback } from "./title-playback.svelte"

  interface Props {
    playback: TitlePlayback
    /** Picking a row plays it straight away. */
    onpick: (episode: EpisodeNumber) => void
    onseason: (season: number) => void
  }

  let { playback, onpick, onseason }: Props = $props()
  const choices = $derived(playback.choices)
</script>

<!-- "Play an episode" (291:10334): season chips, then each episode; what you saw has a tick. -->
<div class="flex flex-col gap-item">
  <p class="type-label-sm text-muted-foreground">Play an episode</p>
  {#if choices.seasons.length > 1}
    <div class="flex flex-wrap gap-related" role="group" aria-label="Season">
      {#each choices.seasons as season (season.number)}
        <Chip
          selected={season.number === choices.selectedSeason}
          onclick={() => onseason(season.number)}>{season.name}</Chip
        >
      {/each}
    </div>
  {/if}
  {#if choices.seasonLoading}
    <p class="type-sm text-muted-foreground" role="status">Loading episodes…</p>
  {:else}
    <div class="max-h-72 overflow-y-auto"><EpisodeRows {playback} {onpick} /></div>
  {/if}
</div>
