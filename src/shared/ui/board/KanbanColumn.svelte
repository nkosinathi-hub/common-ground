<script lang="ts" generics="T extends BoardItem">
  import { Plus } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import { dndzone, type DndEvent } from "svelte-dnd-action"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { dropIn, type BoardItem } from "./drop"

  interface Props {
    /** The stage or status this column holds. */
    id: string
    title: string
    items: readonly T[]
    /** Cards drag only between columns of the same board. */
    board: string
    card: Snippet<[T]>
    /** A card was dropped here; save it, and the items prop brings it back in place. */
    onmove: (id: string, column: string, index: number) => void
    /** Adds a card already in this column (Figma: plus in the heading). */
    onadd?: () => void
    addLabel?: string
    /** Shown in an empty column, e.g. "New ideas land here." */
    empty: string
  }

  let { id, title, items, board, card, onmove, onadd, addLabel, empty }: Props = $props()
  // Follows the items prop; a drag rearranges it until the saved move comes back.
  let shown = $derived<T[]>([...items])

  const consider = (event: CustomEvent<DndEvent<T>>) => (shown = event.detail.items)
  function finalize(event: CustomEvent<DndEvent<T>>) {
    shown = event.detail.items
    const drop = dropIn(shown, event.detail.info)
    if (drop) onmove(drop.id, id, drop.index)
  }
</script>

<!-- Figma Kanban column (208:7756), shared by the ideas board and the tasks Kanban. -->
<section
  aria-label={title}
  class="flex min-w-64 flex-1 snap-start flex-col gap-item rounded-lg bg-muted p-item"
>
  <div class="flex items-center gap-related">
    <h3 class="type-label text-foreground">{title}</h3>
    <Badge variant="outline">{items.length}</Badge>
    <span class="flex-1"></span>
    {#if onadd}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={addLabel ?? `Add to ${title}`}
        onclick={onadd}
      >
        <Plus />
      </Button>
    {/if}
  </div>
  <!-- The empty note sits inside the drop zone, so an empty column still takes a card. -->
  <div class="relative">
    <ul
      class="flex min-h-16 flex-col gap-related rounded-md outline-none"
      aria-label="{title} cards"
      use:dndzone={{
        items: shown,
        type: board,
        flipDurationMs: 150,
        dropTargetStyle: {},
        dropTargetClasses: ["ring-2", "ring-primary/40"],
      }}
      onconsider={consider}
      onfinalize={finalize}
    >
      {#each shown as item (item.id)}<li>{@render card(item)}</li>{/each}
    </ul>
    {#if shown.length === 0}
      <p
        class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md border border-dashed border-border px-inset type-sm text-muted-foreground"
      >
        {empty}
      </p>
    {/if}
  </div>
</section>
