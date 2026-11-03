<script lang="ts">
  import { ErrorState, Loading, SectionHeader } from "@/shared/ui"
  import WatchEmpty from "./WatchEmpty.svelte"
  import WatchGrid from "./WatchGrid.svelte"
  import type { WatchListState } from "./watch-list-state.svelte"

  interface Props {
    spaceId: string
    list: WatchListState
    itemHref: (id: string) => string
    onadd: () => void
  }
  let { spaceId, list, itemHref, onadd }: Props = $props()
</script>

<section class="flex flex-col gap-stack" aria-label="Your collection">
  {#if list.filters.search.trim()}
    <SectionHeader title="In your space" />
    <p class="type-sm text-muted-foreground">Your saved titles matching this search and filters.</p>
  {/if}
  {#if list.status === "error" && list.error}
    <ErrorState error={list.error} onRetry={() => list.load()} />
  {:else if list.status === "loading" && list.items.length === 0}
    <Loading rows={4} label="Gathering your titles" />
  {:else if list.empty}
    <WatchEmpty {list} {onadd} />
  {:else}
    <WatchGrid {spaceId} {list} {itemHref} />
  {/if}
</section>
