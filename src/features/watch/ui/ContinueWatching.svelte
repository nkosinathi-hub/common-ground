<script lang="ts">
  import { Clapperboard } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { AsyncView, EmptyState, Resource } from "@/shared/ui"
  import { DEFAULT_FILTERS } from "../domain/filters"
  import { useWatch } from "./context"
  import WatchCard from "./WatchCard.svelte"

  /** Home shows only the first few titles in progress. */
  const SHOWN = 8

  interface Props {
    spaceId: string
    itemHref: (id: string) => string
    listHref: string
  }

  let { spaceId, itemHref, listHref }: Props = $props()
  const { service } = useWatch()
  const watching = new Resource(() =>
    service.list(spaceId, { ...DEFAULT_FILTERS, myStatus: "watching", sort: "recent" }),
  )
  $effect(() => void watching.load())
</script>

<AsyncView resource={watching}>
  {#snippet children(page)}
    {#if page.items.length === 0}
      <EmptyState
        icon={Clapperboard}
        title="Nothing in progress"
        description="Titles you mark as watching show up here so you can pick up where you left off."
      >
        <Button variant="outline" href={listHref}>Open your list</Button>
      </EmptyState>
    {:else}
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {#each page.items.slice(0, SHOWN) as item (item.id)}
          <WatchCard {item} href={itemHref(item.id)} />
        {/each}
      </div>
    {/if}
  {/snippet}
</AsyncView>
