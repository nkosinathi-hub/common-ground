<script lang="ts">
  import { onDestroy, untrack } from "svelte"
  import { Clapperboard, Plus, SearchX, Shuffle } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Attribution } from "@/features/catalog"
  import { EmptyState, ErrorState, Loading } from "@/shared/ui"
  import AddTitleDialog from "./AddTitleDialog.svelte"
  import { useWatch } from "./context"
  import PickDialog from "./PickDialog.svelte"
  import { PickState } from "./pick-state.svelte"
  import WatchCard from "./WatchCard.svelte"
  import { WatchListState } from "./watch-list.svelte"
  import WatchToolbar from "./WatchToolbar.svelte"

  let { spaceId, itemHref }: { spaceId: string; itemHref: (id: string) => string } = $props()
  const { service } = useWatch()
  const list = new WatchListState(service, () => spaceId)
  const picker = new PickState(service, () => spaceId)
  let adding = $state(false)

  $effect(() => {
    void spaceId
    untrack(() => void list.load())
  })
  onDestroy(() => list.dispose())
</script>

<section class="space-y-6" aria-labelledby="watch-heading">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 id="watch-heading" class="text-2xl font-semibold">Watch</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Movies, series and anime. A little collection of what is next.
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button variant="secondary" onclick={() => picker.start()}>
        <Shuffle aria-hidden="true" />
        Pick for us
      </Button>
      <Button onclick={() => (adding = true)}>
        <Plus aria-hidden="true" />
        Add a title
      </Button>
    </div>
  </header>

  <WatchToolbar {list} />

  {#if list.status === "error" && list.error}
    <ErrorState error={list.error} onRetry={() => list.load()} />
  {:else if list.status === "loading" && list.items.length === 0}
    <Loading rows={4} label="Gathering your titles" />
  {:else if list.empty && list.narrowed}
    <EmptyState
      icon={SearchX}
      title="Nothing here just yet"
      description="Try a different search or filter."
    >
      <Button variant="outline" onclick={() => list.clearFilters()}>Clear filters</Button>
    </EmptyState>
  {:else if list.empty}
    <EmptyState
      icon={Clapperboard}
      title="Your next night in starts here"
      description="Save the movies, series and anime you keep meaning to watch. Mark the ones to enjoy together, then let Pick for us choose."
    >
      <Button onclick={() => (adding = true)}>Add your first title</Button>
    </EmptyState>
  {:else}
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
          {list.loadingMore ? "Loading more" : list.moreError ? "Try again" : "Load more"}
        </Button>
      </div>
    {/if}
  {/if}
  <Attribution />
</section>

<AddTitleDialog bind:open={adding} {spaceId} onAdded={() => list.load()} />
<PickDialog {picker} {itemHref} />
