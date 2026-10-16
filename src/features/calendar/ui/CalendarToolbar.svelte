<script lang="ts">
  import { ChevronLeft, ChevronRight } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { CalendarState } from "./calendar.svelte"

  let { calendar }: { calendar: CalendarState } = $props()
</script>

<div class="flex items-center gap-2">
  <Button
    variant="outline"
    size="icon-sm"
    aria-label="Previous month"
    onclick={() => calendar.move(-1)}
  >
    <ChevronLeft aria-hidden="true" />
  </Button>
  <Button variant="outline" size="sm" onclick={() => calendar.goToday()}>Today</Button>
  <Button variant="outline" size="icon-sm" aria-label="Next month" onclick={() => calendar.move(1)}>
    <ChevronRight aria-hidden="true" />
  </Button>
  <h2 id="calendar-month-title" aria-live="polite" class="ml-1 text-lg font-semibold">
    {calendar.title}
  </h2>
</div>
