<script lang="ts">
  import { Label } from "$lib/components/ui/label"
  import { toast } from "@/shared/ui"
  import type { CalendarEvent } from "../domain"
  import { useCalendar } from "./context"
  import { reminderLabel, REMINDER_OPTIONS } from "./labels"

  interface Props {
    event: CalendarEvent
  }

  let { event }: Props = $props()
  const { service } = useCalendar()
  const current = $derived(event.myReminders.length ? String(event.myReminders[0]) : "none")
  // Keeps a reminder set elsewhere (for example 2 days before) choosable.
  const options = $derived(
    REMINDER_OPTIONS.some((option) => option.value === current)
      ? REMINDER_OPTIONS
      : [...REMINDER_OPTIONS, { value: current, label: reminderLabel(Number(current)) }],
  )

  async function save(value: string) {
    const result = await service.setMyReminders(event.id, value === "none" ? [] : [Number(value)])
    if (result.ok) toast.success(value === "none" ? "Reminder off" : "Reminder saved")
    else toast.error(result.error.message)
  }
</script>

<div class="grid max-w-xs gap-1.5">
  <Label for="my-reminder">Remind me</Label>
  <select
    id="my-reminder"
    class="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
    value={current}
    onchange={(change) => save(change.currentTarget.value)}
  >
    {#each options as option (option.value)}<option value={option.value}>{option.label}</option
      >{/each}
  </select>
  <p class="text-xs text-muted-foreground">Only you get this reminder.</p>
</div>
