<script lang="ts">
  import type { DateOnly } from "@/shared/domain"
  import { cellLabel, type DayItem } from "../domain"
  import EntryChip from "./EntryChip.svelte"

  const SHOWN = 3

  interface Props {
    day: DateOnly
    items: readonly DayItem[]
    inMonth: boolean
    isToday: boolean
    selected: boolean
    zone: string
    spaceId: string
    onselect: (day: DateOnly) => void
    onkey: (event: KeyboardEvent, day: DateOnly) => void
  }

  let { day, items, inMonth, isToday, selected, zone, spaceId, onselect, onkey }: Props = $props()
</script>

<div
  role="gridcell"
  tabindex={selected ? 0 : -1}
  aria-selected={selected}
  aria-current={isToday ? "date" : undefined}
  aria-label={cellLabel(day, items.length)}
  data-day={day}
  class="flex min-h-12 min-w-0 flex-col gap-0.5 border-t p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-24
    {inMonth ? '' : 'bg-muted/40 text-muted-foreground'} {selected ? 'bg-accent' : ''}"
  onclick={() => onselect(day)}
  onkeydown={(event) => onkey(event, day)}
>
  <span
    aria-hidden="true"
    class="grid size-6 place-items-center rounded-full text-xs {isToday
      ? 'bg-primary font-semibold text-primary-foreground'
      : ''}">{Number(day.slice(8))}</span
  >
  <ul class="hidden flex-col gap-0.5 md:flex">
    {#each items.slice(0, SHOWN) as item (item.key)}
      <li><EntryChip {item} {day} {zone} {spaceId} tabbable={false} compact /></li>
    {/each}
  </ul>
  {#if items.length > SHOWN}
    <span aria-hidden="true" class="hidden px-1 text-xs text-muted-foreground md:block"
      >+{items.length - SHOWN} more</span
    >
  {/if}
  <span aria-hidden="true" class="flex justify-center gap-0.5 md:hidden">
    {#each items.slice(0, SHOWN) as item (item.key)}
      <span class="size-1.5 rounded-full bg-primary"></span>
    {/each}
  </span>
</div>
