<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import type { DateOnly } from "@/shared/domain"
  import { FormState, Resource, toast } from "@/shared/ui"
  import type { CalendarEvent } from "../domain"
  import { viewerZone } from "./browser"
  import { useCalendar } from "./context"
  import { EventFormState } from "./event-form.svelte"
  import EventFields from "./EventFields.svelte"
  import WatchNightPicker from "./WatchNightPicker.svelte"

  interface Props {
    open: boolean
    spaceId: string
    /** The event being edited; a new one when absent. */
    event?: CalendarEvent | null
    day: DateOnly
    /** Opens straight on the watch-together picker. */
    watchNight?: boolean
    onSaved: (eventId: string) => void
  }

  let {
    open = $bindable(false),
    spaceId,
    event = null,
    day,
    watchNight = false,
    onSaved,
  }: Props = $props()
  const { service } = useCalendar()
  const form = new EventFormState()
  const submission = new FormState()
  const people = new Resource(() => service.members(untrack(() => spaceId)))

  async function prepare(current: CalendarEvent | null) {
    if (current) form.fill(current)
    else form.reset(day, viewerZone(), [])
    submission.error = null
    await people.load()
    // A new event invites everyone in the space by default.
    if (!current) form.attendees = (people.value ?? []).map((member) => member.id)
  }
  $effect(() => {
    if (open) untrack(() => void prepare(event))
  })

  async function submit(submitEvent: SubmitEvent) {
    submitEvent.preventDefault()
    const draft = form.toDraft()
    const saved = await submission.run<unknown>(() =>
      event
        ? service.update(event.id, draft, form.attendees)
        : service.create(spaceId, draft, form.attendees),
    )
    if (!saved.ok) return
    toast.success(event ? "Event saved" : "Event added")
    open = false
    onSaved(event ? event.id : (saved.value as string))
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title
        >{event ? "Edit event" : watchNight ? "Plan a watch night" : "New event"}</Dialog.Title
      >
      <Dialog.Description>Everyone in this space can see it.</Dialog.Description>
    </Dialog.Header>
    <form class="grid gap-4" onsubmit={submit} novalidate aria-label="Event">
      {#if !event}
        {#key open}
          <WatchNightPicker
            {spaceId}
            expanded={watchNight}
            onPick={(title) => form.planWatchNight(title)}
          />
        {/key}
      {/if}
      <EventFields
        {form}
        {spaceId}
        members={people.value ?? []}
        errorFor={(f) => submission.fieldError(f)}
      />
      {#if submission.formError}
        <p role="alert" class="text-sm text-destructive">{submission.formError}</p>
      {/if}
      <Dialog.Footer>
        <Button type="button" variant="ghost" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" disabled={submission.pending}>{event ? "Save" : "Add event"}</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
