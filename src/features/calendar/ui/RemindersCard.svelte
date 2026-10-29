<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { SelectField, toast } from "@/shared/ui"
  import type { CalendarEvent } from "../domain"
  import { useCalendar } from "./context"
  import { reminderLabel, REMINDER_OPTIONS } from "./labels"

  interface Props {
    event: CalendarEvent
    /** Opens the event editor, where the reminder for everyone is set; absent when not allowed. */
    onEdit?: () => void
  }

  let { event, onEdit }: Props = $props()
  const { service } = useCalendar()
  const saved = $derived(event.myReminders.length ? String(event.myReminders[0]) : "none")
  let choice = $state<string | null>(null)
  const current = $derived(choice ?? saved)
  // Keeps a reminder set elsewhere (for example 2 days before) choosable.
  const options = $derived(
    REMINDER_OPTIONS.some((option) => option.value === saved)
      ? REMINDER_OPTIONS
      : [...REMINDER_OPTIONS, { value: saved, label: reminderLabel(Number(saved)) }],
  )
  const forEveryone = $derived(
    event.defaultReminders.length
      ? `${event.defaultReminders.map(reminderLabel).join(", ")}, for everyone invited`
      : "None, for everyone invited",
  )
  let busy = $state(false)

  async function save() {
    busy = true
    const result = await service.setMyReminders(event.id, current === "none" ? [] : [+current])
    busy = false
    if (!result.ok) return toast.error(result.error.message)
    toast.success(current === "none" ? "Reminder off" : "Reminder saved")
    choice = null
  }
</script>

<!-- D14 Reminders: your own reminder, then the one everyone invited gets. -->
<Card.Root>
  <Card.Header><Card.Title>Reminders</Card.Title></Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    <div class="flex flex-col gap-related">
      <SelectField
        id="my-reminder"
        label="Remind me"
        value={current}
        {options}
        onchange={(value) => (choice = value)}
      />
      <p class="type-xs text-muted-foreground">Only you get this reminder.</p>
    </div>
    <Button class="self-start" disabled={busy || current === saved} onclick={save}
      >Save reminder</Button
    >
    <div class="flex items-start justify-between gap-item">
      <div class="flex flex-col gap-hairline">
        <p class="type-label text-foreground">Event reminder</p>
        <p class="type-sm text-muted-foreground">{forEveryone}</p>
      </div>
      {#if onEdit}<Button
          variant="link"
          class="px-0"
          aria-label="Edit the event reminder"
          onclick={onEdit}>Edit</Button
        >{/if}
    </div>
  </Card.Content>
</Card.Root>
