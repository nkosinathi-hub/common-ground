<script lang="ts">
  import { Search, Shuffle } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import * as ToggleGroup from "$lib/components/ui/toggle-group"
  import { SEARCH_MAX } from "../domain/filters"
  import { MEDIA_TYPES } from "../domain/labels"
  import type { MediaType } from "../domain/types"
  import WatchFilterRow from "./WatchFilterRow.svelte"
  import type { WatchListState } from "./watch-list-state.svelte"

  const PLURAL = { movie: "Movies", series: "Series", anime: "Anime" } as const

  interface Props {
    list: WatchListState
    /** Titles per type, for the counts on the type filter. */
    counts: Record<MediaType, number> | null
    onpick: () => void
  }

  let { list, counts, onpick }: Props = $props()
  const all = $derived(counts ? counts.movie + counts.series + counts.anime : null)
  const count = (n: number | null | undefined) => (n == null ? "" : ` ${n}`)
</script>

<!-- D02 rows on wide screens (type and Pick for us, then search, lists, progress, sort); on
     phones (M02) the search comes first and the filters share one swipeable line. -->
<div
  class="flex flex-col gap-stack lg:grid lg:grid-cols-[auto_1fr] lg:items-center lg:gap-x-related"
>
  <label class="relative lg:col-start-1 lg:row-start-2 lg:w-field-search">
    <span class="sr-only">Search your titles</span>
    <Search
      class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
    <Input
      type="search"
      class="pl-9"
      maxlength={SEARCH_MAX}
      placeholder="Search your collection"
      value={list.filters.search}
      oninput={(event) => list.search(event.currentTarget.value)}
    />
  </label>
  <ToggleGroup.Root
    type="single"
    variant="segment"
    spacing={1}
    aria-label="Type"
    value={list.filters.mediaType ?? "all"}
    onValueChange={(value) =>
      value && list.setFilter({ mediaType: value === "all" ? null : (value as MediaType) })}
    class="lg:col-start-1 lg:row-start-1 lg:w-fit!"
  >
    <ToggleGroup.Item value="all">All{count(all)}</ToggleGroup.Item>
    {#each MEDIA_TYPES as type (type.value)}
      <ToggleGroup.Item value={type.value}
        >{PLURAL[type.value]}{count(counts?.[type.value])}</ToggleGroup.Item
      >
    {/each}
  </ToggleGroup.Root>
  <WatchFilterRow {list} />
  <Button
    variant="secondary"
    class="w-fit lg:col-start-2 lg:row-start-1 lg:justify-self-end"
    onclick={onpick}
  >
    <Shuffle aria-hidden="true" />Pick for us
  </Button>
</div>
