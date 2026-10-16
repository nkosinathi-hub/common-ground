<script lang="ts">
  import { untrack } from "svelte"
  import { CalendarDays } from "@lucide/svelte"
  import { buildHash, todayDateOnly } from "@/shared/domain"
  import { AsyncView, EmptyState, Resource } from "@/shared/ui"
  import { addDays, dayHeading, entriesByDay } from "../domain"
  import { viewerZone } from "./browser"
  import { useCalendar } from "./context"
  import EntryChip from "./EntryChip.svelte"

  interface Props {
    spaceId: string
  }

  let { spaceId }: Props = $props()
  const { service } = useCalendar()
  const zone = viewerZone()
  const today = todayDateOnly()
  const week = new Resource(() =>
    service.week(
      untrack(() => spaceId),
      today,
      zone,
    ),
  )
  // Reloads when Home switches to another space.
  $effect(() => {
    void spaceId
    void week.load()
  })
</script>

<AsyncView resource={week}>
  {#snippet children(entries)}
    {@const days = [...entriesByDay(entries, today, addDays(today, 6), zone)]}
    {#if days.length === 0}
      <EmptyState icon={CalendarDays} title="Nothing this week" level={2}>
        <a href={buildHash({ name: "calendar", spaceId })} class="text-sm underline"
          >Open the calendar</a
        >
      </EmptyState>
    {:else}
      <ol class="flex flex-col gap-3" data-testid="upcoming-events">
        {#each days as [day, items] (day)}
          <li>
            <p class="text-xs font-medium text-muted-foreground">
              {day === today ? "Today" : dayHeading(day)}
            </p>
            <ul>
              {#each items as item (item.key)}<li>
                  <EntryChip {item} {day} {zone} {spaceId} />
                </li>{/each}
            </ul>
          </li>
        {/each}
      </ol>
    {/if}
  {/snippet}
</AsyncView>
