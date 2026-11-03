<script lang="ts">
  import { onDestroy, untrack } from "svelte"
  import { Plus } from "@lucide/svelte"
  import { PageAction, Resource, useSearchControl } from "@/shared/ui"
  import AddTitleDialog from "./AddTitleDialog.svelte"
  import { useWatch } from "./context"
  import PickDialog from "./PickDialog.svelte"
  import { PickState } from "./pick-state.svelte"
  import { onWatchChanged } from "./changed"
  import WatchCollection from "./WatchCollection.svelte"
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
  const search = useSearchControl()
  const add = () => (search ? search.open() : (adding = true))
  const counts = new Resource(() => service.countByType(spaceId))
  const reload = () => void (list.load(), counts.load())

  $effect(() => {
    // Reload when the space changes; the load itself must not become a dependency.
    void spaceId
    untrack(() => void (list.load(), counts.load()))
  })
  onDestroy(() => list.dispose())
  $effect(() =>
    onWatchChanged((changed) => {
      if (changed === spaceId) reload()
    }),
  )
</script>

<!-- Universal search and the primary add action live in the shell. -->
<section class="flex flex-col gap-stack" aria-labelledby="watch-heading">
  <header class="flex items-start gap-columns">
    <div class="flex min-w-0 flex-1 flex-col gap-related">
      <h1 id="watch-heading" class="type-h1">Our next good watch.</h1>
    </div>
  </header>

  <WatchToolbar {list} counts={counts.value ?? null} onpick={() => picker.start()} />

  <WatchCollection {spaceId} {list} {itemHref} onadd={add} />
</section>
<PageAction icon={Plus} label="Add a title" onclick={add} />

<AddTitleDialog bind:open={adding} {spaceId} {defaultIntent} onAdded={reload} />
<PickDialog {picker} {itemHref} />
