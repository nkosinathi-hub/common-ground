<script lang="ts">
  import { untrack } from "svelte"
  import {
    appError,
    buildHash,
    canDelete,
    err,
    FORMER_MEMBER,
    todayDateOnly,
  } from "@/shared/domain"
  import { AsyncView, Resource, toast, navigate } from "@/shared/ui"
  import type { CalendarEvent } from "../domain"
  import { viewerZone } from "./browser"
  import ConflictWarning from "./ConflictWarning.svelte"
  import { useCalendar } from "./context"
  import EventDialog from "./EventDialog.svelte"
  import EventDetailsCard from "./EventDetailsCard.svelte"
  import EventHeader from "./EventHeader.svelte"
  import LinkedCard from "./LinkedCard.svelte"
  import RemindersCard from "./RemindersCard.svelte"
  import RsvpCard from "./RsvpCard.svelte"

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
    if (!result.ok) return void toast.error(result.error.message)
    toast.success("Event deleted")
    navigate(calendarHref)
  }
</script>

<!-- Figma D14: the header, then details and answers beside reminders and what it is linked to. -->
<AsyncView resource={event}>
  {#snippet children(current)}
    {@const mayChange = canDelete(current.createdBy, { me, isOwner })}
    <div class="flex flex-col gap-section">
      <EventHeader
        event={current}
        {spaceId}
        {zone}
        {mayChange}
        onEdit={() => (editing = true)}
        onDelete={remove}
      />
      <div class="grid items-start gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]">
        <div class="flex flex-col gap-columns">
          <ConflictWarning event={current} {spaceId} {zone} />
          <EventDetailsCard event={current} {zone} />
          <RsvpCard event={current} {me} {nameOf} onAnswered={() => event.load()} />
        </div>
        <div class="flex flex-col gap-columns">
          <RemindersCard event={current} onEdit={mayChange ? () => (editing = true) : undefined} />
          <LinkedCard event={current} {spaceId} />
        </div>
      </div>
    </div>
    <EventDialog
      bind:open={editing}
      {spaceId}
      event={current}
      day={todayDateOnly()}
      onSaved={() => event.load()}
      onDelete={mayChange ? remove : undefined}
    />
  {/snippet}
</AsyncView>
