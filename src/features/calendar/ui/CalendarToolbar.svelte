<script lang="ts">
  import { ChevronLeft, ChevronRight } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { ViewToggle } from "@/shared/ui"
  import { utcOffset, zoneCity } from "../domain"
  import type { CalendarState } from "./calendar-state.svelte"
  import type { CalendarView } from "./view-memory"

  interface Props {
    calendar: CalendarState
    zone: string
  }

  let { calendar, zone }: Props = $props()
  const views = [
    { value: "month", label: "Month" },
    { value: "agenda", label: "Agenda" },
  ] as const
</script>

<!-- D12, D13 and M05 toolbar: move by month, the month's name, then the zone and the view. -->
<div class="flex flex-wrap items-center justify-between gap-stack">
  <div class="flex w-full items-center gap-related md:w-auto">
    <Button
      variant="outline"
      size="icon-sm"
      class="max-md:order-2 max-md:border-0 max-md:bg-transparent max-md:shadow-none"
      aria-label="Previous month"
      onclick={() => calendar.move(-1)}><ChevronLeft aria-hidden="true" /></Button
    >
    <Button variant="outline" size="sm" class="max-md:hidden" onclick={() => calendar.goToday()}
      >Today</Button
    >
    <Button
      variant="outline"
      size="icon-sm"
      class="max-md:order-3 max-md:border-0 max-md:bg-transparent max-md:shadow-none"
      aria-label="Next month"
      onclick={() => calendar.move(1)}><ChevronRight aria-hidden="true" /></Button
    >
    <h2
      id="calendar-month-title"
      aria-live="polite"
      class="type-h2 text-foreground max-md:order-1 max-md:mr-auto md:ml-related"
    >
      {calendar.title}
    </h2>
  </div>
  <div class="flex w-full items-center gap-item md:w-auto">
    <span class="type-xs text-muted-foreground max-md:hidden"
      >{zoneCity(zone)}, {utcOffset(zone, Date.now())}</span
    >
    <ViewToggle
      label="Calendar view"
      class="max-md:w-full! max-md:[&>*]:flex-1"
      value={calendar.view}
      options={views}
      onchange={(view) => calendar.setView(view as CalendarView)}
    />
  </div>
</div>
