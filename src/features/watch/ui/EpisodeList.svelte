<script lang="ts">
  import { untrack } from "svelte"
  import { Users } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import * as ToggleGroup from "$lib/components/ui/toggle-group"
  import { formatDateOnly, memberName, type DateOnly, type MemberRef } from "@/shared/domain"
  import { AsyncView, Resource } from "@/shared/ui"
  import { episodeRows, seasonsOf, type EpisodeStatus } from "../domain/episodes"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"

  let { item, names }: { item: WatchItem; names: readonly MemberRef[] } = $props()
  const { history } = useWatch()
  const statuses = new Resource<EpisodeStatus[]>(() =>
    history ? history.statuses(untrack(() => item.id)) : Promise.resolve({ ok: true, value: [] }),
  )
  $effect(() => void untrack(() => statuses.load()))
  // Opens on the season the space is in together, else the furthest anyone has reached.
  let chosen = $state<number | null>(null)
  const season = $derived(
    chosen ?? item.together?.season ?? seasonsOf(statuses.value ?? [], item.together).at(-1) ?? 1,
  )
  // Episodes known so far: up to the furthest anyone watched, or the next one together.
  const count = (list: readonly EpisodeStatus[]) =>
    Math.max(
      0,
      ...list.filter((s) => s.season === season).map((s) => s.episode),
      item.together?.season === season ? (item.together.episode ?? 0) + 1 : 0,
    )
</script>

<!-- M03b: each episode watched together, seen by some of you, up next, or not watched. -->
<AsyncView resource={statuses}>
  {#snippet children(list)}
    {@const seasons = seasonsOf(list, item.together)}
    {#if seasons.length > 1}
      <ToggleGroup.Root
        type="single"
        variant="segment"
        spacing={1}
        aria-label="Season"
        value={String(season)}
        onValueChange={(value) => value && (chosen = Number(value))}
      >
        {#each seasons as s (s)}<ToggleGroup.Item value={String(s)}>Season {s}</ToggleGroup.Item
          >{/each}
      </ToggleGroup.Root>
    {/if}
    <ol class="flex flex-col divide-y divide-border" aria-label="Season {season} episodes">
      {#each episodeRows(season, count(list), list, item.together) as row (row.episode)}
        <li class="flex items-center gap-item py-item">
          <span class="w-10 shrink-0 type-label text-foreground tabular-nums">E{row.episode}</span>
          {#if row.state.kind === "together"}
            <Users class="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span class="flex-1 type-sm text-foreground"
              >Watched together {formatDateOnly(row.state.on as DateOnly)}</span
            >
          {:else if row.state.kind === "seen"}
            <span class="flex-1 type-sm text-foreground"
              >Seen by {row.state.by.map((id) => memberName(names, id)).join(", ")}</span
            >
          {:else if row.state.kind === "next"}
            <span class="flex-1 type-sm text-foreground">Next together</span><Badge>Up next</Badge>
          {:else}
            <span class="flex-1 type-sm text-muted-foreground">Not watched yet</span>
          {/if}
        </li>
      {:else}
        <li class="py-item type-sm text-muted-foreground">Nobody has watched an episode yet.</li>
      {/each}
    </ol>
  {/snippet}
</AsyncView>
