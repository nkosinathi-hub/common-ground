<script lang="ts">
  import { Clapperboard, SearchX } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { EmptyState } from "@/shared/ui"
  import type { WatchListState } from "./watch-list-state.svelte"

  /** An empty library: nothing matches the filters, or nothing has been added yet. */
  let { list, onadd }: { list: WatchListState; onadd: () => void } = $props()
</script>

{#if list.narrowed}
  <EmptyState
    icon={SearchX}
    title="Nothing here just yet"
    description="Try a different search or filter."
  >
    <Button variant="outline" onclick={() => list.clearFilters()}>Clear filters</Button>
  </EmptyState>
{:else}
  <EmptyState
    icon={Clapperboard}
    title="Your next night in starts here"
    description="Save the movies, series and anime you keep meaning to watch. Mark the ones to enjoy together, then let Pick for us choose."
  >
    <Button onclick={onadd}>Add your first title</Button>
  </EmptyState>
{/if}
