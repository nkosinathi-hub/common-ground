<script lang="ts">
  import { Cake, CalendarDays, Flag, SquareCheck } from "@lucide/svelte"
  import type { DateOnly } from "@/shared/domain"
  import { entryTime, type DayItem } from "../domain"
  import { entryHref } from "./links"

  const KINDS = {
    event: { icon: CalendarDays, label: "Event" },
    occasion: { icon: Cake, label: "Every year" },
    task: { icon: SquareCheck, label: "Task due" },
    milestone: { icon: Flag, label: "Milestone" },
  }

  interface Props {
    item: DayItem
    day: DateOnly
    zone: string
    spaceId: string
    /** Off inside the month grid, where focus moves between days instead. */
    tabbable?: boolean
    compact?: boolean
  }

  let { item, day, zone, spaceId, tabbable = true, compact = false }: Props = $props()
  const kind = $derived(KINDS[item.entry.kind])
  const time = $derived(entryTime(item.entry.timing, day, zone))
  const done = $derived(item.entry.status === "done")
  const continued = $derived(item.span === "middle" || item.span === "end")
</script>

<a
  href={entryHref(spaceId, item.entry)}
  tabindex={tabbable ? undefined : -1}
  data-testid="calendar-entry"
  class="flex min-w-0 items-center gap-1.5 rounded-md hover:bg-muted {compact
    ? 'px-1 text-xs'
    : 'p-2 text-sm'}"
>
  <kind.icon class="size-3.5 shrink-0 text-primary" aria-hidden="true" />
  <span class="sr-only">{kind.label}:</span>
  {#if time}<span class="shrink-0 text-muted-foreground tabular-nums">{time}</span>{/if}
  <span class="truncate" class:line-through={done}>{item.entry.title}</span>
  {#if continued && !compact}<span class="text-xs text-muted-foreground">(continued)</span>{/if}
</a>
