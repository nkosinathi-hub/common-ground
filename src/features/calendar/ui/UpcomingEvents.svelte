<script lang="ts">
  import { untrack } from "svelte"
  import { CalendarDays, ChevronRight } from "@lucide/svelte"
  import { buildHash, todayDateOnly } from "@/shared/domain"
  import { AsyncView, EmptyState, Resource, TextLink } from "@/shared/ui"
  import { entriesByDay, entryTime } from "../domain"
  import { viewerZone } from "./browser"
  import { useCalendar } from "./context"
  import { entryHref } from "./links"

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
    untrack(() => void week.load())
  })
</script>

<!-- "Today, together" (D01): today's plans as rows, each opening its event. -->
<AsyncView resource={week}>
  {#snippet children(entries)}
    {@const items = entriesByDay(entries, today, today, zone).get(today) ?? []}
    {#if items.length === 0}
      <EmptyState icon={CalendarDays} title="Nothing planned today" level={3}>
        <TextLink href={buildHash({ name: "calendar", spaceId })}>Open the calendar</TextLink>
      </EmptyState>
    {:else}
      <ul class="-mx-related flex flex-col" data-testid="upcoming-events">
        {#each items as item (item.key)}
          <li>
            <a
              href={entryHref(spaceId, item.entry)}
              class="flex min-h-9 items-center gap-inset rounded-md px-related outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <span class="w-16 shrink-0 type-label text-foreground tabular-nums">
                {entryTime(item.entry.timing, today, zone) || "All day"}
              </span>
              <span class="min-w-0 flex-1 truncate type-label text-foreground"
                >{item.entry.title}</span
              >
              <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/snippet}
</AsyncView>
