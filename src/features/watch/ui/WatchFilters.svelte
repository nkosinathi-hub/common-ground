<script lang="ts">
  import { untrack } from "svelte"
  import { SlidersHorizontal } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { DialogShell, RevealContent } from "@/shared/ui"
  import { DEFAULT_FILTERS } from "../domain/filters"
  import type { MediaType } from "../domain/types"
  import WatchFilterFields from "./WatchFilterFields.svelte"
  import type { WatchListState } from "./watch-list-state.svelte"
  import { activeChoices } from "./watch-filter-options"
  let { list, counts }: { list: WatchListState; counts: Record<MediaType, number> | null } =
    $props()
  let open = $state(false)
  let draft = $state(untrack(() => ({ ...list.filters })))
  const active = $derived(activeChoices(list.filters))
  function show() {
    draft = { ...list.filters }
    open = true
  }
  function apply() {
    open = false
    void list.setFilter(draft)
  }
</script>

<Button
  variant="ghost"
  size="icon"
  class="reveal-trigger rounded-full"
  aria-label={active.length ? `Filters, ${active.length} active` : "Filters"}
  aria-haspopup="dialog"
  aria-expanded={open}
  onclick={show}
>
  <RevealContent icon={SlidersHorizontal} label="Filters" compact hintSide="top" />
  {#if active.length}<span
      class="pointer-events-none absolute top-0 right-0 grid size-4 place-items-center rounded-full bg-primary type-xs text-primary-foreground"
      aria-hidden="true">{active.length}</span
    >{/if}
</Button>
<DialogShell
  bind:open
  title="Your collection, your way"
  description="Choose what to show, then apply."
  primary="Apply filters"
  onsubmit={apply}
>
  <WatchFilterFields bind:draft {counts} />
  {#snippet footerStart()}<Button variant="ghost" onclick={() => (draft = { ...DEFAULT_FILTERS })}
      >Reset</Button
    >{/snippet}
</DialogShell>
