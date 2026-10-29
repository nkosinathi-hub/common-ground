<script lang="ts">
  import { onDestroy, untrack } from "svelte"
  import { MediaQuery } from "svelte/reactivity"
  import { Plus } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { Button } from "$lib/components/ui/button"
  import { Attribution } from "@/features/catalog"
  import { ErrorState, Fab, Loading, Resource } from "@/shared/ui"
  import AddTitleDialog from "./AddTitleDialog.svelte"
  import { useWatch } from "./context"
  import PickDialog from "./PickDialog.svelte"
  import { PickState } from "./pick-state.svelte"
  import WatchEmpty from "./WatchEmpty.svelte"
  import WatchGrid from "./WatchGrid.svelte"
  import { WatchListState } from "./watch-list-state.svelte"
  import WatchToolbar from "./WatchToolbar.svelte"

  interface Props {
    spaceId: string
    itemHref: (id: string) => string
    defaultIntent?: "want_to_watch" | "watch_together"
  }

  let { spaceId, itemHref, defaultIntent }: Props = $props()
  const { service } = useWatch()
  const list = new WatchListState(service, () => spaceId)
  const picker = new PickState(service, () => spaceId)
  let adding = $state(false)
  const wide = new MediaQuery("min-width: 768px")
  const counts = new Resource(() => service.countByType(spaceId))
  const all = $derived(
    counts.value ? counts.value.movie + counts.value.series + counts.value.anime : null,
  )

  $effect(() => {
    // Reload when the space changes; the load itself must not become a dependency.
    void spaceId
    untrack(() => void (list.load(), counts.load()))
  })
  onDestroy(() => list.dispose())
</script>

<!-- D02 and M02. The add action is icon-only: the page is already about titles. -->
<section class="flex flex-col gap-section" aria-labelledby="watch-heading">
  <header class="flex items-start gap-columns">
    <div class="flex min-w-0 flex-1 flex-col gap-related">
      <h1 id="watch-heading" class="type-h1">Our next good watch.</h1>
      <p class="type-body text-muted-foreground">Films, series and anime you want to share.</p>
    </div>
    {#if wide.current}
      <Button size="icon" aria-label="Add a title" onclick={() => (adding = true)}><Plus /></Button>
    {/if}
  </header>

  <WatchToolbar {list} counts={counts.value ?? null} onpick={() => picker.start()} />

  {#if list.status === "error" && list.error}
    <ErrorState error={list.error} onRetry={() => list.load()} />
  {:else if list.status === "loading" && list.items.length === 0}
    <Loading rows={4} label="Gathering your titles" />
  {:else if list.empty}
    <WatchEmpty {list} onadd={() => (adding = true)} />
  {:else}
    <WatchGrid {spaceId} {list} {itemHref} />
  {/if}
  {#if list.narrowed && !list.empty && all !== null}
    <Alert.Root variant="secondary">
      <Alert.Description>
        Not finding a title? Clear the filters to see all {all}, or add one with the plus button.
      </Alert.Description>
    </Alert.Root>
  {/if}
  <Attribution />
</section>
{#if !wide.current}
  <Fab
    icon={Plus}
    label="Add a title"
    onclick={() => (adding = true)}
    class="fixed right-gutter bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30"
  />
{/if}

<AddTitleDialog
  bind:open={adding}
  {spaceId}
  {defaultIntent}
  onAdded={() => void (list.load(), counts.load())}
/>
<PickDialog {picker} {itemHref} />
