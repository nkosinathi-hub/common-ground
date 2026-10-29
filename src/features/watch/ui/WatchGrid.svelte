<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { spaceNames } from "./space-names.svelte"
  import { MediaQuery } from "svelte/reactivity"
  import WatchCard from "./WatchCard.svelte"
  import WatchRow from "./WatchRow.svelte"
  import type { WatchListState } from "./watch-list-state.svelte"

  interface Props {
    spaceId: string
    list: WatchListState
    itemHref: (id: string) => string
    me?: string
  }

  let { spaceId, list, itemHref, me }: Props = $props()
  const wide = new MediaQuery("min-width: 768px")
  const names = spaceNames(() => spaceId)
</script>

<!-- D02 cards in columns on wide screens; M02 rows on phones. -->
{#if wide.current}
  <ul
    aria-label="Titles"
    class="grid grid-cols-2 gap-columns lg:grid-cols-3"
    aria-busy={list.status === "loading"}
  >
    {#each list.items as item (item.id)}
      <li><WatchCard {item} href={itemHref(item.id)} names={names.value ?? []} {me} /></li>
    {/each}
  </ul>
{:else}
  <ul
    aria-label="Titles"
    class="flex flex-col divide-y divide-border"
    aria-busy={list.status === "loading"}
  >
    {#each list.items as item (item.id)}
      <li><WatchRow {item} href={itemHref(item.id)} names={names.value ?? []} /></li>
    {/each}
  </ul>
{/if}
{#if list.moreError}
  <p role="alert" class="text-center type-sm text-destructive">{list.moreError.message}</p>
{/if}
{#if list.next}
  <div class="flex justify-center">
    <Button variant="outline" disabled={list.loadingMore} onclick={() => list.loadMore()}>
      {list.moreLabel}
    </Button>
  </div>
{/if}
