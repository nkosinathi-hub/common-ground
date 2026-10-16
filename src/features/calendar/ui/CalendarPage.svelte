<script lang="ts">
  import { untrack } from "svelte"
  import { Plus, Popcorn } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Tabs from "$lib/components/ui/tabs"
  import { buildHash, todayDateOnly, type DateOnly } from "@/shared/domain"
  import { AsyncView } from "@/shared/ui"
  import type { WeekStart } from "../domain"
  import AgendaList from "./AgendaList.svelte"
  import { isWide, viewerZone } from "./browser"
  import { CalendarState } from "./calendar.svelte"
  import CalendarToolbar from "./CalendarToolbar.svelte"
  import { useCalendar } from "./context"
  import DayPanel from "./DayPanel.svelte"
  import EventDialog from "./EventDialog.svelte"
  import MonthGrid from "./MonthGrid.svelte"
  import { browserMemory, type CalendarView } from "./view-memory"

  interface Props {
    spaceId: string
    /** spaces.week_starts_on when known; Monday otherwise. */
    weekStart?: WeekStart
  }

  let { spaceId, weekStart = 1 }: Props = $props()
  const { service } = useCalendar()
  const zone = viewerZone()
  const calendar = new CalendarState({
    service,
    spaceId: untrack(() => spaceId),
    zone,
    today: todayDateOnly(),
    weekStart: untrack(() => weekStart),
    memory: browserMemory(),
    wide: isWide(),
  })
  $effect(() => void calendar.load())

  let dialog = $state({ open: false, day: todayDateOnly(), watchNight: false })
  const plan = (day: DateOnly, watchNight = false) => (dialog = { open: true, day, watchNight })
  const created = (eventId: string) =>
    (location.hash = buildHash({ name: "event", spaceId, eventId }))
</script>

<div class="flex flex-col gap-4">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <h1 class="text-2xl font-semibold">Calendar</h1>
    <div class="flex flex-wrap gap-2">
      <Button variant="outline" onclick={() => plan(calendar.selected, true)}>
        <Popcorn aria-hidden="true" />Plan a watch night
      </Button>
      <Button onclick={() => plan(calendar.selected)}><Plus aria-hidden="true" />New event</Button>
    </div>
  </div>
  <CalendarToolbar {calendar} />
  <Tabs.Root value={calendar.view} onValueChange={(view) => calendar.setView(view as CalendarView)}>
    <Tabs.List aria-label="Calendar view">
      <Tabs.Trigger value="month">Month</Tabs.Trigger>
      <Tabs.Trigger value="agenda">Agenda</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="month" class="flex flex-col gap-4">
      <AsyncView resource={calendar.window}>
        {#snippet children(_window)}
          <MonthGrid {calendar} {weekStart} {zone} {spaceId} />
          <DayPanel
            day={calendar.selected}
            items={calendar.days.get(calendar.selected) ?? []}
            {zone}
            {spaceId}
            onAdd={(day) => plan(day)}
          />
        {/snippet}
      </AsyncView>
    </Tabs.Content>
    <Tabs.Content value="agenda">
      <AgendaList agenda={calendar.agenda} {zone} {spaceId} onRetry={() => calendar.load()} />
    </Tabs.Content>
  </Tabs.Root>
</div>

<EventDialog
  bind:open={dialog.open}
  {spaceId}
  day={dialog.day}
  watchNight={dialog.watchNight}
  onSaved={created}
/>
