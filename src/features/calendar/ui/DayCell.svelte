<script lang="ts">
  import type { DateOnly } from "@/shared/domain"
  import { cellLabel, entryTime, type DayItem } from "../domain"
  import { KINDS } from "./kinds"
  import { entryHref } from "./links"

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

<!-- Figma Calendar day (D12): the date, then a pill per plan; phones show dots instead. -->
<div
  role="gridcell"
  tabindex={selected ? 0 : -1}
  aria-selected={selected}
  aria-current={isToday ? "date" : undefined}
  aria-label={cellLabel(day, items.length)}
  data-day={day}
  class="flex min-h-12 min-w-0 cursor-pointer flex-col gap-hairline border-t border-l border-border p-related outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-inset md:min-h-28
    {selected ? 'bg-secondary' : ''}"
  onclick={() => onselect(day)}
  onkeydown={(event) => onkey(event, day)}
>
  <span
    aria-hidden="true"
    class="grid size-6 place-items-center rounded-full type-label-sm {isToday
      ? 'bg-primary text-primary-foreground'
      : inMonth
        ? 'text-foreground'
        : 'text-muted-foreground'}">{Number(day.slice(8))}</span
  >
  <ul class="hidden flex-col gap-hairline md:flex">
    {#each items.slice(0, SHOWN) as item (item.key)}
      {@const time = entryTime(item.entry.timing, day, zone)}
      <li>
        <a
          href={entryHref(spaceId, item.entry)}
          tabindex="-1"
          class="block truncate rounded-sm bg-card px-related py-0.5 type-xs text-primary hover:bg-muted"
          ><span class="sr-only">{KINDS[item.entry.kind].label}:</span>
          {#if time}<span class="tabular-nums">{time}</span>{/if}
          {item.entry.title}</a
        >
      </li>
    {/each}
  </ul>
  {#if items.length > SHOWN}
    <span aria-hidden="true" class="hidden px-related type-xs text-muted-foreground md:block"
      >+{items.length - SHOWN} more</span
    >
  {/if}
  <span aria-hidden="true" class="flex justify-center gap-0.5 md:hidden">
    {#each items.slice(0, SHOWN) as item (item.key)}
      <span class="size-1.5 rounded-full bg-primary"></span>
    {/each}
  </span>
</div>
