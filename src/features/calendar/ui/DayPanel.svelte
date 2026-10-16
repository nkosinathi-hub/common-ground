<script lang="ts">
  import { Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { DateOnly } from "@/shared/domain"
  import { dayHeading, type DayItem } from "../domain"
  import EntryChip from "./EntryChip.svelte"

  interface Props {
    day: DateOnly
    items: readonly DayItem[]
    zone: string
    spaceId: string
    onAdd: (day: DateOnly) => void
  }

  let { day, items, zone, spaceId, onAdd }: Props = $props()
</script>

<section aria-labelledby="selected-day-heading" class="flex flex-col gap-2" data-testid="day-panel">
  <div class="flex items-center justify-between gap-2">
    <h2 id="selected-day-heading" class="text-base font-semibold">{dayHeading(day)}</h2>
    <Button variant="ghost" size="sm" onclick={() => onAdd(day)}>
      <Plus aria-hidden="true" />Add on this day
    </Button>
  </div>
  {#if items.length === 0}
    <p class="text-sm text-muted-foreground">Nothing planned.</p>
  {:else}
    <ul class="flex flex-col">
      {#each items as item (item.key)}
        <li><EntryChip {item} {day} {zone} {spaceId} /></li>
      {/each}
    </ul>
  {/if}
</section>
