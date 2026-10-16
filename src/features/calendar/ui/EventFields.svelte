<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import type { MemberRef } from "@/shared/domain"
  import type { EventFormState } from "./event-form-state.svelte"
  import EventTiming from "./EventTiming.svelte"
  import FieldError from "./FieldError.svelte"
  import { REMINDER_OPTIONS } from "./labels"
  import LinkPicker from "./LinkPicker.svelte"

  interface Props {
    form: EventFormState
    spaceId: string
    members: readonly MemberRef[]
    errorFor: (field: string) => string | undefined
  }

  let { form, spaceId, members, errorFor }: Props = $props()
  const select = "h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
</script>

<div class="grid gap-1.5">
  <Label for="event-title">Title</Label>
  <Input
    id="event-title"
    bind:value={form.title}
    maxlength={200}
    aria-invalid={errorFor("title") ? true : undefined}
  />
  <FieldError message={errorFor("title")} />
</div>
<EventTiming {form} {errorFor} />
<div class="grid gap-1.5">
  <Label for="event-location">Where</Label>
  <Input id="event-location" bind:value={form.location} maxlength={300} />
  <FieldError message={errorFor("location")} />
</div>
<div class="grid gap-1.5">
  <Label for="event-description">Details</Label>
  <Textarea id="event-description" bind:value={form.description} rows={3} />
  <FieldError message={errorFor("description")} />
</div>
<fieldset class="grid gap-1.5">
  <legend class="mb-1.5 text-sm font-medium">Who is invited</legend>
  {#each members as member (member.id)}
    <label class="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        class="size-4 accent-primary"
        checked={form.attendees.includes(member.id)}
        onchange={(event) => form.toggleAttendee(member.id, event.currentTarget.checked)}
      />
      {member.displayName}
    </label>
  {/each}
</fieldset>
<div class="grid gap-1.5">
  <Label for="event-reminder">Remind people</Label>
  <select id="event-reminder" class={select} bind:value={form.reminder}>
    {#each REMINDER_OPTIONS as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  <FieldError message={errorFor("reminders")} />
</div>
<LinkPicker {spaceId} bind:value={form.link} />
