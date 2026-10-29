<script lang="ts">
  import { Check, Play } from "@lucide/svelte"
  import { cn } from "$lib/utils"
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
  const before = (season: number, episode: number) =>
    playback.next !== null &&
    (season < playback.next.season ||
      (season === playback.next.season && episode < playback.next.episode))
  const isNext = (season: number, episode: number) =>
    playback.next?.season === season && playback.next.episode === episode
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
    <ul class="flex max-h-72 flex-col overflow-y-auto" aria-label="Episodes">
      {#each choices.episodes as episode (episode.number)}
        {@const season = choices.selectedSeason}
        {@const next = isNext(season, episode.number)}
        <li>
          <button
            type="button"
            class={cn(
              "flex h-10 w-full items-center gap-item rounded-md px-related text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/20",
              next && "bg-secondary",
            )}
            onclick={() => onpick({ season, episode: episode.number })}
          >
            <span class="w-6 type-label-sm text-muted-foreground">E{episode.number}</span>
            <span class="min-w-0 flex-1 truncate type-sm text-foreground">{episode.name}</span>
            {#if next}<Play class="size-4 text-primary" aria-label="Up next" />
            {:else if before(season, episode.number)}<Check
                class="size-4 text-muted-foreground"
                aria-label="Watched"
              />{/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
