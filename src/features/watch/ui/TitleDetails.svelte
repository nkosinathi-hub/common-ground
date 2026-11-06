<script lang="ts">
  import type { Snippet } from "svelte"
  import { DialogShell } from "@/shared/ui"
  import type { WatchItemView } from "../domain/types"
  import ItemActions from "./ItemActions.svelte"
  import ListMenu from "./ListMenu.svelte"
  import OpinionToggle from "./OpinionToggle.svelte"

  let {
    open = $bindable(false),
    view,
    backHref,
    tools,
    onChanged,
  }: {
    open: boolean
    view: WatchItemView
    backHref: string
    tools?: Snippet
    onChanged: () => void
  } = $props()
  const item = $derived(view.item)
</script>

<DialogShell bind:open title="About this title" description={item.title} cancelLabel="Done">
  {#if item.synopsis}<p class="type-body leading-relaxed text-foreground">{item.synopsis}</p>
  {:else}<p class="type-sm text-muted-foreground">No synopsis has been added.</p>{/if}
  <div class="flex flex-col gap-item">
    <h2 class="type-label-sm text-muted-foreground">In your space</h2>
    <div class="flex flex-wrap items-center gap-item">
      <ListMenu {item} {onChanged} />
      <OpinionToggle spaceId={item.spaceId} itemId={item.id} />
      {@render tools?.()}
      <ItemActions {view} {backHref} {onChanged} />
    </div>
  </div>
</DialogShell>
