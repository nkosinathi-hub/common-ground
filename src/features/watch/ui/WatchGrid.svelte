<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import WatchCard from "./WatchCard.svelte"
  import type { WatchListState } from "./watch-list.svelte"

  interface Props {
    list: WatchListState
    itemHref: (id: string) => string
  }

  let { list, itemHref }: Props = $props()
</script>

<ul
  class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
  aria-busy={list.status === "loading"}
>
  {#each list.items as item (item.id)}
    <li><WatchCard {item} href={itemHref(item.id)} /></li>
  {/each}
</ul>
{#if list.moreError}
  <p role="alert" class="text-center text-sm text-destructive">{list.moreError.message}</p>
{/if}
{#if list.next}
  <div class="flex justify-center">
    <Button variant="outline" disabled={list.loadingMore} onclick={() => list.loadMore()}>
      {list.moreLabel}
    </Button>
  </div>
{/if}
