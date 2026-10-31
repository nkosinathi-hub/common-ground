<script lang="ts">
  import { ArrowRight, CalendarDays } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { todayDateOnly } from "@/shared/domain"
  import { EmptyState } from "@/shared/ui"
  import {
    addMonths,
    dayHeading,
    monthName,
    utcOffset,
    type DayItem,
    type WeekStart,
  } from "../domain"
  import type { CalendarState } from "./calendar-state.svelte"
  import DueRow from "./DueRow.svelte"
  import EventRow from "./EventRow.svelte"
  import type { Who } from "./kinds"
  import WeekStrip from "./WeekStrip.svelte"

  interface Props {
    calendar: CalendarState
    weekStart: WeekStart
    zone: string
    spaceId: string
    who: Who
  }

  let { calendar, weekStart, zone, spaceId, who }: Props = $props()
  const day = $derived(calendar.selected)
  const isDue = (item: DayItem) => item.entry.kind === "task" || item.entry.kind === "milestone"
  const items = $derived(calendar.days.get(day) ?? [])
  const events = $derived(items.filter((item) => !isDue(item)))
  const due = $derived(items.filter(isDue))
  const later = $derived(calendar.agenda.days.filter(([d]) => d > day))
  const month = $derived(calendar.agenda.month)
</script>

<!-- Figma M05: the week strip, the chosen day, what is due, then the rest of the month. -->
<div class="flex flex-col gap-section">
  <WeekStrip selected={day} {weekStart} onselect={(picked) => calendar.select(picked)} />
  <section class="flex flex-col gap-item" aria-labelledby="phone-day">
    <hgroup>
      <h2 id="phone-day" class="type-h2 text-foreground">{dayHeading(day)}</h2>
      <p class="type-xs text-muted-foreground">{zone} · {utcOffset(zone, Date.now())}</p>
    </hgroup>
    {#if events.length}
      <Card.Root class="py-related"
        ><Card.Content class="flex flex-col divide-y divide-border">
          {#each events as item (item.key)}<EventRow {item} {day} {zone} {spaceId} {who} />{/each}
        </Card.Content></Card.Root
      >
    {:else}
      <p class="type-sm text-muted-foreground">Nothing planned.</p>
    {/if}
  </section>
  {#if due.length}
    <section class="flex flex-col gap-item" aria-labelledby="phone-due">
      <h2 id="phone-due" class="type-h2 text-foreground">
        {day === todayDateOnly() ? "Due today" : "Due"}
      </h2>
      <Card.Root class="py-related"
        ><Card.Content class="flex flex-col divide-y divide-border">
          {#each due as item (item.key)}<DueRow {item} {spaceId} {who} />{/each}
        </Card.Content></Card.Root
      >
    </section>
  {/if}
  {#if month}
    <section class="flex flex-col gap-item" aria-labelledby="phone-rest">
      <h2 id="phone-rest" class="type-h2 text-foreground">The rest of {monthName(month)}</h2>
      {#if later.length}
        <Card.Root class="py-related"
          ><Card.Content class="flex flex-col divide-y divide-border">
            {#each later as [d, rest] (d)}
              {#each rest as item (item.key)}
                {#if isDue(item)}<DueRow {item} {spaceId} {who} />
                {:else}<EventRow {item} day={d} {zone} {spaceId} {who} />{/if}
              {/each}
            {/each}
          </Card.Content></Card.Root
        >
      {:else}
        <EmptyState
          icon={CalendarDays}
          title="Nothing else scheduled"
          description="There is still room to make a plan."
        />
      {/if}
      {#if calendar.agenda.hasMore}
        <Button variant="link" class="self-start px-0" onclick={() => calendar.agenda.loadMore()}>
          Show {monthName(addMonths(month, 1))}<ArrowRight aria-hidden="true" />
        </Button>
      {/if}
    </section>
  {/if}
</div>
