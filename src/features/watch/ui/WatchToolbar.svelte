<script lang="ts">
  import { RotateCcw, Shuffle } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { RevealContent } from "@/shared/ui"
  import { DEFAULT_FILTERS } from "../domain/filters"
  import type { MediaType } from "../domain/types"
  import WatchFilters from "./WatchFilters.svelte"
  import type { WatchListState } from "./watch-list-state.svelte"
  import { activeChoices } from "./watch-filter-options"
  let {
    list,
    counts,
    onpick,
  }: {
    list: WatchListState
    counts: Record<MediaType, number> | null
    onpick: () => void
  } = $props()
  const active = $derived(activeChoices(list.filters))
  const total = $derived(counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : null)
</script>

<div role="group" aria-label="Collection controls" class="flex min-w-0 items-center gap-related">
  <div class="min-w-0 flex-1 type-sm text-muted-foreground" aria-live="polite">
    {#if active.length}<p class="truncate" title={active.join(" · ")}>{active.join(" · ")}</p>
    {:else if total !== null}<p>{total} {total === 1 ? "title" : "titles"}</p>{/if}
  </div>
  {#if active.length}<Button
      variant="ghost"
      size="icon"
      class="reveal-trigger rounded-full"
      aria-label="Clear filters"
      onclick={() => list.setFilter({ ...DEFAULT_FILTERS })}
    >
      <RevealContent icon={RotateCcw} label="Clear filters" compact hintSide="top" />
    </Button>{/if}
  <WatchFilters {list} {counts} />
  <Button
    variant="ghost"
    size="icon"
    class="reveal-trigger rounded-full"
    aria-label="Pick for us"
    onclick={onpick}
  >
    <RevealContent icon={Shuffle} label="Pick for us" compact hintSide="top" />
  </Button>
</div>
