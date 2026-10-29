<script lang="ts">
  import { untrack } from "svelte"
  import type { DateOnly } from "@/shared/domain"
  import { DialogShell, FormError, FormState, Resource, toast } from "@/shared/ui"
  import { peopleLine, type CalendarEvent } from "../domain"
  import { viewerZone } from "./browser"
  import { useCalendar } from "./context"
  import EventDeleteAction from "./EventDeleteAction.svelte"
  import { EventFormState } from "./event-form-state.svelte"
  import { tabOf, type EventTab } from "./event-tabs"
  import EventTabs from "./EventTabs.svelte"
  import EventDetailsTab from "./EventDetailsTab.svelte"
  import EventPeopleTab from "./EventPeopleTab.svelte"
  import EventWhenTab from "./EventWhenTab.svelte"

  interface Props {
    open: boolean
    spaceId: string
    /** The event being edited; a new one when absent. */
    event?: CalendarEvent | null
    day: DateOnly
    onSaved: (eventId: string) => void
    /** Offered on an event being edited by someone allowed to delete it. */
    onDelete?: () => Promise<void>
  }

  let { open = $bindable(false), spaceId, event = null, day, onSaved, onDelete }: Props = $props()
  const { service } = useCalendar()
  const form = new EventFormState()
  const submission = new FormState()
  const people = new Resource(() => service.members(untrack(() => spaceId)))
  let tab = $state<EventTab>("details")
  const invited = $derived(
    peopleLine(
      (people.value ?? []).filter((m) => form.attendees.includes(m.id)).map((m) => m.displayName),
    ),
  )

  async function prepare(current: CalendarEvent | null) {
    if (current) form.fill(current)
    else form.reset(day, viewerZone(), [])
    submission.error = null
    tab = "details"
    await people.load()
    // A new event invites everyone in the space by default.
    if (!current) form.attendees = (people.value ?? []).map((member) => member.id)
  }
  $effect(() => {
    if (open) untrack(() => void prepare(event))
  })

  async function submit() {
    const draft = form.toDraft()
    const saved = await submission.run<unknown>(() =>
      event
        ? service.update(event.id, draft, form.attendees)
        : service.create(spaceId, draft, form.attendees),
    )
    if (!saved.ok) return void (tab = tabOf(submission.error?.field))
    toast.success(event ? "Event saved" : "Event added")
    open = false
    onSaved(event ? event.id : (saved.value as string))
  }
</script>

<!-- Figma S06 to S06d: the event composer, its fields in three tabs. -->
<DialogShell
  bind:open
  wide
  title={event ? "Edit event" : "Make a little time"}
  description={event
    ? `Changes are shared with ${invited || "everyone invited"} when you save.`
    : `New event. Shared with ${invited || "the people you invite"} once you create it.`}
  primary={event ? "Save changes" : "Create event"}
  busy={submission.pending}
  onsubmit={submit}
>
  {#snippet header()}<EventTabs bind:value={tab} />{/snippet}
  {#if tab === "details"}
    <EventDetailsTab {form} errorFor={(f) => submission.fieldError(f)} />
  {:else if tab === "when"}
    <EventWhenTab {form} errorFor={(f) => submission.fieldError(f)} />
  {:else}
    <EventPeopleTab
      {form}
      {spaceId}
      members={people.value ?? []}
      watchNight={!event}
      errorFor={(f) => submission.fieldError(f)}
    />
  {/if}
  <FormError message={submission.formError} />
  {#snippet footerStart()}
    {#if event && onDelete}<EventDeleteAction {onDelete} />{/if}
  {/snippet}
</DialogShell>
