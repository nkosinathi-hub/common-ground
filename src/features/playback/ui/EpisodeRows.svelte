<script lang="ts">
  import { Play, Check } from "@lucide/svelte"
  import { cn } from "$lib/utils"
  import type { EpisodeNumber } from "../application/ports"
  import type { TitlePlayback } from "./title-playback.svelte"
  let {
    playback,
    onpick,
  }: {
    playback: TitlePlayback
    onpick: (episode: EpisodeNumber) => void
  } = $props()
  const choices = $derived(playback.choices)
</script>

<ul class="flex flex-col divide-y divide-border/60" aria-label="Episodes">
  {#each choices.episodes as episode (episode.number)}
    {@const season = choices.selectedSeason}
    {@const next = playback.next?.season === season && playback.next.episode === episode.number}
    {@const before =
      playback.next &&
      (season < playback.next.season ||
        (season === playback.next.season && episode.number < playback.next.episode))}
    {@const selected =
      playback.mode === "title" &&
      playback.selected?.season === season &&
      playback.selected.episode === episode.number &&
      playback.play.status !== "idle"}
    <li>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        aria-label={`Play S${season} E${episode.number}: ${episode.name}`}
        class={cn(
          "group/episode flex min-h-14 w-full items-center gap-item rounded-lg px-related py-related text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
          selected ? "bg-primary/10 ring-1 ring-primary/30" : next && "bg-secondary/50",
        )}
        onclick={() => onpick({ season, episode: episode.number })}
      >
        <span class="w-8 shrink-0 type-sm text-foreground tabular-nums"
          >{String(episode.number).padStart(2, "0")}</span
        >
        <span class="min-w-0 flex-1 type-sm text-foreground">{episode.name}</span>
        {#if selected}<span class="type-caption shrink-0 text-primary"
            >{playback.play.status === "loading"
              ? "Loading"
              : playback.play.status === "error"
                ? "Selected"
                : "Playing"}</span
          >
        {:else if next}<span class="type-caption shrink-0 text-primary">Up next</span>
        {:else if before}<Check
            class="size-4 shrink-0 text-muted-foreground"
            aria-current={selected ? "true" : undefined}
            aria-label="Before your place"
          />{/if}
        <Play
          class="size-4 shrink-0 text-primary opacity-60 transition-opacity group-hover/episode:opacity-100"
          aria-hidden="true"
        />
      </button>
    </li>
  {/each}
</ul>
