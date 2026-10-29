<script lang="ts">
  import { Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { todayDateOnly, type DateOnly } from "@/shared/domain"
  import { dayHeading, type DayItem } from "../domain"
  import DueRow from "./DueRow.svelte"
  import EventRow from "./EventRow.svelte"
  import type { Who } from "./kinds"

  interface Props {
    day: DateOnly
    items: readonly DayItem[]
    zone: string
    spaceId: string
    who: Who
    onAdd: (day: DateOnly) => void
  }

  let { day, items, zone, spaceId, who, onAdd }: Props = $props()
  const isDue = (item: DayItem) => item.entry.kind === "task" || item.entry.kind === "milestone"
  const events = $derived(items.filter((item) => !isDue(item)))
  const due = $derived(items.filter(isDue))
</script>

<!-- Figma Day card (D12 aside): the chosen day's plans, then what is due, then add to it. -->
<Card.Root role="region" aria-labelledby="selected-day-heading" data-testid="day-panel">
  <Card.Header>
    <Card.Title id="selected-day-heading">{dayHeading(day)}</Card.Title>
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    {#if events.length}
      <ul class="flex flex-col">
        {#each events as item (item.key)}<li>
            <EventRow {item} {day} {zone} {spaceId} {who} />
          </li>{/each}
      </ul>
    {:else if !due.length}
      <p class="type-sm text-muted-foreground">Nothing planned.</p>
    {/if}
    {#if due.length}
      <section class="flex flex-col" aria-labelledby="due-heading">
        <h3 id="due-heading" class="type-label-sm text-muted-foreground">
          {day === todayDateOnly() ? "Due today" : "Due"}
        </h3>
        <ul class="flex flex-col">
          {#each due as item (item.key)}<li><DueRow {item} {spaceId} {who} /></li>{/each}
        </ul>
      </section>
    {/if}
    <Button variant="ghost" class="self-start px-0 has-[>svg]:px-0" onclick={() => onAdd(day)}>
      <Plus aria-hidden="true" />Add to this day
    </Button>
  </Card.Content>
</Card.Root>
