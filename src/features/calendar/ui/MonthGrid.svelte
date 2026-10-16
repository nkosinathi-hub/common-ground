<script lang="ts">
  import { tick } from "svelte"
  import { todayDateOnly, type DateOnly } from "@/shared/domain"
  import { gridMove, monthOf, weekdayName, type WeekStart } from "../domain"
  import type { CalendarState } from "./calendar-state.svelte"
  import DayCell from "./DayCell.svelte"

  interface Props {
    calendar: CalendarState
    weekStart: WeekStart
    zone: string
    spaceId: string
  }

  let { calendar, weekStart, zone, spaceId }: Props = $props()
  let grid = $state<HTMLElement | null>(null)
  const days = $derived(calendar.days)
  const weeks = $derived(Array.from({ length: 6 }, (_, w) => calendar.grid.slice(w * 7, w * 7 + 7)))
  const today = todayDateOnly()
  const inMonth = (day: DateOnly) => monthOf(day).month === calendar.month.month

  // The ARIA grid pattern: arrows, Home/End and PageUp/PageDown move a single tab stop.
  async function onkey(event: KeyboardEvent, day: DateOnly) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      return void calendar.select(day)
    }
    const next = gridMove(day, event.key, weekStart)
    if (!next) return
    event.preventDefault()
    void calendar.select(next)
    await tick()
    grid?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus()
  }
</script>

<div
  bind:this={grid}
  role="grid"
  aria-labelledby="calendar-month-title"
  class="overflow-hidden rounded-xl border"
  data-testid="month-grid"
>
  <div role="row" class="grid grid-cols-7 bg-muted/50">
    {#each weeks[0] ?? [] as day (day)}
      <div role="columnheader" class="py-1 text-center text-xs font-medium">
        <abbr title={weekdayName(day, "long")} class="no-underline"
          >{weekdayName(day, "short")}</abbr
        >
      </div>
    {/each}
  </div>
  {#each weeks as week (week[0])}
    <div role="row" class="grid grid-cols-7 divide-x">
      {#each week as day (day)}
        <DayCell
          {day}
          items={days.get(day) ?? []}
          inMonth={inMonth(day)}
          isToday={day === today}
          selected={day === calendar.selected}
          {zone}
          {spaceId}
          onselect={(picked) => calendar.select(picked)}
          {onkey}
        />
      {/each}
    </div>
  {/each}
</div>
