<script lang="ts">
  import { untrack } from "svelte"
  import { ArrowLeft, Download, Pencil } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { appError, buildHash, err, FORMER_MEMBER, todayDateOnly } from "@/shared/domain"
  import { AsyncView, DeleteButton, Resource, toast, navigate } from "@/shared/ui"
  import { eventIcs, icsFileName, type CalendarEvent } from "../domain"
  import { saveFile, viewerZone } from "./browser"
  import ConflictWarning from "./ConflictWarning.svelte"
  import { useCalendar } from "./context"
  import EventDialog from "./EventDialog.svelte"
  import EventSummary from "./EventSummary.svelte"
  import MyReminders from "./MyReminders.svelte"
  import RsvpChips from "./RsvpChips.svelte"

  interface Props {
    spaceId: string
    eventId: string
    me: string
    isOwner: boolean
  }

  let { spaceId, eventId, me, isOwner }: Props = $props()
  const { service } = useCalendar()
  const zone = viewerZone()
  // An event is only shown under the space in the URL, so links never cross spaces.
  const event = new Resource<CalendarEvent>(async () => {
    const found = await service.get(untrack(() => eventId))
    if (!found.ok || found.value.spaceId === untrack(() => spaceId)) return found
    return err(appError("not_found", "That event is not in this space"))
  })
  const people = new Resource(() => service.authors(untrack(() => spaceId)))
  $effect(() => {
    void event.load()
    void people.load()
  })
  const nameOf = (userId: string) =>
    people.value?.find((member) => member.id === userId)?.displayName ?? FORMER_MEMBER
  const calendarHref = $derived(buildHash({ name: "calendar", spaceId }))
  let editing = $state(false)

  async function remove() {
    const result = await service.remove(eventId)
    if (!result.ok) return toast.error(result.error.message)
    toast.success("Event deleted")
    navigate(calendarHref)
  }
</script>

<div class="flex flex-col gap-4">
  <a href={calendarHref} class="inline-flex items-center gap-1 text-sm text-muted-foreground">
    <ArrowLeft class="size-4" aria-hidden="true" />Calendar
  </a>
  <AsyncView resource={event}>
    {#snippet children(current)}
      {@const mayChange = current.createdBy === me || isOwner}
      <EventSummary event={current} {zone} {spaceId} />
      <ConflictWarning event={current} {spaceId} {zone} />
      <RsvpChips event={current} {me} {nameOf} onAnswered={() => event.load()} />
      <MyReminders event={current} />
      <div class="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onclick={() =>
            saveFile(icsFileName(current.title), eventIcs(current, new Date()), "text/calendar")}
        >
          <Download aria-hidden="true" />Download .ics
        </Button>
        {#if mayChange}
          <Button variant="outline" onclick={() => (editing = true)}>
            <Pencil aria-hidden="true" />Edit
          </Button>
          <DeleteButton label="Delete event" what="this event" size="icon-sm" onConfirm={remove} />
        {/if}
      </div>
      <EventDialog
        bind:open={editing}
        {spaceId}
        event={current}
        day={todayDateOnly()}
        onSaved={() => event.load()}
      />
    {/snippet}
  </AsyncView>
</div>
