<script lang="ts">
  import { CalendarDays } from "@lucide/svelte"
  import { EmptyState, ErrorState, LoadMore, Loading } from "@/shared/ui"
  import { dayHeading } from "../domain"
  import type { AgendaState } from "./agenda-state.svelte"
  import EntryChip from "./EntryChip.svelte"

  interface Props {
    agenda: AgendaState
    zone: string
    spaceId: string
    onRetry: () => void
  }

  let { agenda, zone, spaceId, onRetry }: Props = $props()
  const days = $derived(agenda.days)
</script>

{#if agenda.loading}
  <Loading label="Loading the agenda" />
{:else if agenda.error && days.length === 0}
  <ErrorState error={agenda.error} {onRetry} />
{:else if days.length === 0}
  <EmptyState
    icon={CalendarDays}
    title="Nothing planned yet"
    description="Events, task due dates and milestones show up here."
  />
{:else}
  <ol class="flex flex-col gap-4" data-testid="agenda">
    {#each days as [day, items] (day)}
      <li>
        <section aria-labelledby="agenda-{day}" class="flex flex-col gap-1">
          <h2 id="agenda-{day}" class="text-base font-semibold">{dayHeading(day)}</h2>
          <ul class="flex flex-col">
            {#each items as item (item.key)}
              <li><EntryChip {item} {day} {zone} {spaceId} /></li>
            {/each}
          </ul>
        </section>
      </li>
    {/each}
  </ol>
{/if}
{#if !agenda.loading}<LoadMore list={agenda} label="Show the next month" />{/if}
