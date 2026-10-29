<script lang="ts">
  import { Label } from "$lib/components/ui/label"
  import { NativeSelect } from "$lib/components/ui/native-select"
  import type { PlaybackEpisode, PlaybackSeason } from "../application/ports"

  interface Props {
    seasons: readonly PlaybackSeason[]
    episodes: readonly PlaybackEpisode[]
    selectedSeason: number
    selectedEpisode: number
    detailsLoading: boolean
    seasonLoading: boolean
    onseason: (season: number) => void
    onepisode: (episode: number) => void
  }

  /** Season and episode side by side: any episode, not only the next one. */
  let props: Props = $props()
</script>

<div class="grid gap-item sm:grid-cols-2">
  <div class="flex flex-col gap-related">
    <Label for="play-season">Season</Label>
    <NativeSelect
      class="w-full"
      id="play-season"
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
    </NativeSelect>
  </div>
  <div class="flex flex-col gap-related">
    <Label for="play-episode">Episode</Label>
    <NativeSelect
      class="w-full"
      id="play-episode"
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
    </NativeSelect>
  </div>
</div>
