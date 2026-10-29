<script lang="ts">
  import { flip } from "svelte/animate"
  import { dndzone, type DndEvent } from "svelte-dnd-action"
  import { ArrowDown, ArrowUp, GripVertical } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Switch } from "$lib/components/ui/switch"
  import { HOME_CARD_LABELS, moveCard, toggleCard, type HomeCardId } from "@/shared/domain"

  interface Props {
    /** Shown cards in order. */
    cards: HomeCardId[]
    /** Every card: shown first, then hidden. */
    rows: readonly HomeCardId[]
  }

  let { cards = $bindable(), rows }: Props = $props()
  type Row = { id: HomeCardId }
  let items = $state<Row[]>([])
  $effect.pre(() => void (items = rows.map((id) => ({ id }))))
  const DURATION = 150

  function consider(event: CustomEvent<DndEvent<Row>>) {
    items = event.detail.items
  }
  function finalize(event: CustomEvent<DndEvent<Row>>) {
    items = event.detail.items
    cards = items.map((row) => row.id).filter((id) => cards.includes(id))
  }
</script>

<!-- Figma D16a Home modules: drag a handle or use the arrows; the switch shows or hides it. -->
<ul
  class="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border"
  use:dndzone={{ items, flipDurationMs: DURATION, dropTargetStyle: {} }}
  onconsider={consider}
  onfinalize={finalize}
>
  {#each items as row (row.id)}
    {@const label = HOME_CARD_LABELS[row.id]}
    {@const shown = cards.includes(row.id)}
    {@const index = cards.indexOf(row.id)}
    <li
      class="flex items-center gap-item bg-card px-item py-related"
      animate:flip={{ duration: DURATION }}
    >
      <GripVertical class="size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden="true" />
      <span class="min-w-0 flex-1 type-label {shown ? 'text-foreground' : 'text-muted-foreground'}"
        >{label}</span
      >
      <Switch
        checked={shown}
        aria-label="Show {label}"
        onCheckedChange={() => (cards = toggleCard(cards, row.id))}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Move {label} up"
        disabled={!shown || index === 0}
        onclick={() => (cards = moveCard(cards, row.id, -1))}><ArrowUp aria-hidden="true" /></Button
      >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Move {label} down"
        disabled={!shown || index === cards.length - 1}
        onclick={() => (cards = moveCard(cards, row.id, 1))}
        ><ArrowDown aria-hidden="true" /></Button
      >
    </li>
  {/each}
</ul>
