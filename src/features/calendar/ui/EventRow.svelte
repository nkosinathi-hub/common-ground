<script lang="ts">
  import { ChevronRight } from "@lucide/svelte"
  import type { DateOnly } from "@/shared/domain"
  import { entryTime, localDay, localTime, type DayItem } from "../domain"
  import { KINDS, type Who } from "./kinds"
  import { entryHref } from "./links"

  interface Props {
    item: DayItem
    day: DateOnly
    zone: string
    spaceId: string
    who: Who
  }

  let { item, day, zone, spaceId, who }: Props = $props()
  const entry = $derived(item.entry)
  const timing = $derived(entry.timing)
  const start = $derived(entryTime(timing, day, zone))
  const end = $derived(
    !timing.allDay && localDay(timing.endsAt, zone) === day ? localTime(timing.endsAt, zone) : "",
  )
  const meta = $derived([entry.place, who(entry.people)].filter(Boolean).join(" · "))
</script>

<!-- Figma Event row (D12, D13, M05): when on the left, what and where, the whole row opens it. -->
<a
  href={entryHref(spaceId, entry)}
  data-testid="calendar-entry"
  class="-mx-related flex items-center gap-item rounded-md px-related py-related outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
>
  <span class="flex w-16 shrink-0 flex-col">
    <span class="type-label text-foreground tabular-nums">{start || "All day"}</span>
    {#if end}<span class="type-xs text-muted-foreground tabular-nums">to {end}</span>{/if}
    {#if item.span === "middle" || item.span === "end"}
      <span class="type-xs text-muted-foreground">continued</span>
    {/if}
  </span>
  <span class="flex min-w-0 flex-1 flex-col gap-hairline">
    <span class="truncate type-label text-foreground"
      ><span class="sr-only">{KINDS[entry.kind].label}:</span> {entry.title}</span
    >
    {#if meta}<span class="truncate type-sm text-muted-foreground">{meta}</span>{/if}
  </span>
  <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
</a>
