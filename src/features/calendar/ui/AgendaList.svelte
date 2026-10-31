<script lang="ts">
  import { CalendarDays, ChevronRight } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { ErrorState, Loading } from "@/shared/ui"
  import { addMonths, dayHeading, monthName, weekdayName, type DayItem } from "../domain"
  import type { AgendaState } from "./agenda-state.svelte"
  import DueRow from "./DueRow.svelte"
  import EventRow from "./EventRow.svelte"
  import type { Who } from "./kinds"

  interface Props {
    agenda: AgendaState
    zone: string
    spaceId: string
    who: Who
    onRetry: () => void
  }

  let { agenda, zone, spaceId, who, onRetry }: Props = $props()
  const days = $derived(agenda.days)
  const isDue = (item: DayItem) => item.entry.kind === "task" || item.entry.kind === "milestone"
</script>

<!-- Figma Agenda (D13): one card, a day per row with its date large, then the month's end. -->
{#if agenda.loading}
  <Loading label="Loading the agenda" />
{:else if agenda.error && days.length === 0}
  <ErrorState error={agenda.error} {onRetry} />
{:else}
  <Card.Root>
    <Card.Content class="flex flex-col gap-section">
      {#if days.length}
        <ol class="flex flex-col gap-section" data-testid="agenda">
          {#each days as [day, items] (day)}
            <li class="grid gap-item sm:grid-cols-[9rem_1fr]">
              <h2 id="agenda-{day}" class="flex items-baseline gap-related sm:flex-col sm:gap-0">
                <span class="sr-only">{dayHeading(day)}</span>
                <span aria-hidden="true" class="type-h1 text-primary">{Number(day.slice(8))}</span>
                <span aria-hidden="true" class="type-label-sm text-foreground"
                  >{weekdayName(day, "long")}</span
                >
              </h2>
              <ul class="flex flex-col" aria-labelledby="agenda-{day}">
                {#each items as item (item.key)}
                  <li>
                    {#if isDue(item)}<DueRow {item} {spaceId} {who} />
                    {:else}<EventRow {item} {day} {zone} {spaceId} {who} />{/if}
                  </li>
                {/each}
              </ul>
            </li>
          {/each}
        </ol>
      {/if}
      {#if agenda.month}
        <div
          class="flex flex-col items-center gap-item rounded-lg bg-muted p-card text-center"
          data-testid="agenda-end"
        >
          <CalendarDays class="size-4 text-muted-foreground" aria-hidden="true" />
          <p class="type-label text-foreground">
            {days.length ? "That is everything for" : "Nothing planned in"}
            {monthName(agenda.month)}
          </p>
          {#if agenda.hasMore}
            <Button
              variant="outline"
              size="sm"
              disabled={agenda.loadingMore}
              onclick={() => agenda.loadMore()}
            >
              Show {monthName(addMonths(agenda.month, 1))}<ChevronRight aria-hidden="true" />
            </Button>
          {/if}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
{/if}
