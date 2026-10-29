<script lang="ts">
  import { untrack } from "svelte"
  import { Plus } from "@lucide/svelte"
  import { FORMER_MEMBER, todayDateOnly, type DateOnly } from "@/shared/domain"
  import { AsyncView, Fab, navigate, Resource } from "@/shared/ui"
  import { peopleLine, type WeekStart } from "../domain"
  import AgendaList from "./AgendaList.svelte"
  import CalendarHeader from "./CalendarHeader.svelte"
  import { isWide, viewerZone } from "./browser"
  import { CalendarState } from "./calendar-state.svelte"
  import CalendarToolbar from "./CalendarToolbar.svelte"
  import { useCalendar } from "./context"
  import DayCard from "./DayCard.svelte"
  import EventDialog from "./EventDialog.svelte"
  import MonthGrid from "./MonthGrid.svelte"
  import PhoneAgenda from "./PhoneAgenda.svelte"
  import { browserMemory } from "./view-memory"

  interface Props {
    spaceId: string
    /** The space's name, for "Everything Ana & Ben have planned". */
    spaceName?: string
    /** spaces.week_starts_on when known; Monday otherwise. */
    weekStart?: WeekStart
  }

  let { spaceId, spaceName = "you", weekStart = 1 }: Props = $props()
  const { service } = useCalendar()
  const zone = viewerZone()
  const wide = isWide()
  const calendar = new CalendarState({
    service,
    spaceId: untrack(() => spaceId),
    zone,
    today: todayDateOnly(),
    weekStart: untrack(() => weekStart),
    memory: browserMemory(),
    wide,
  })
  const people = new Resource(() => service.authors(untrack(() => spaceId)))
  $effect(() => void (calendar.load(), people.load()))
  const who = (ids: readonly string[]) =>
    peopleLine(
      ids.map((id) => people.value?.find((p) => p.id === id)?.displayName ?? FORMER_MEMBER),
    )

  let dialog = $state({ open: false, day: todayDateOnly() })
  const plan = (day: DateOnly) => (dialog = { open: true, day })
  const created = (eventId: string) => navigate({ name: "event", spaceId, eventId })
  const month = $derived(calendar.view === "month")
</script>

<!-- Figma D12 (month), D13 (agenda) and M05 (phone agenda). -->
<div class="flex flex-col gap-section">
  <CalendarHeader {month} {spaceName} onNew={() => plan(calendar.selected)} />
  <CalendarToolbar {calendar} {zone} />
  {#if month}
    <AsyncView resource={calendar.window}>
      {#snippet children(_window)}
        <div class="grid items-start gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]">
          <MonthGrid {calendar} {weekStart} {zone} {spaceId} />
          <DayCard
            day={calendar.selected}
            items={calendar.days.get(calendar.selected) ?? []}
            {zone}
            {spaceId}
            {who}
            onAdd={plan}
          />
        </div>
      {/snippet}
    </AsyncView>
  {:else if wide}
    <AgendaList agenda={calendar.agenda} {zone} {spaceId} {who} onRetry={() => calendar.load()} />
  {:else}
    <PhoneAgenda {calendar} {weekStart} {zone} {spaceId} {who} />
  {/if}
</div>
{#if !wide}<Fab
    icon={Plus}
    label="New event"
    onclick={() => plan(calendar.selected)}
    class="fixed right-gutter bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30"
  />{/if}

<EventDialog bind:open={dialog.open} {spaceId} day={dialog.day} onSaved={created} />
