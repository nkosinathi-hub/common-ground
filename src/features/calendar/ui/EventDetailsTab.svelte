<script lang="ts">
  import { Textarea } from "$lib/components/ui/textarea"
  import { FormField, SelectField } from "@/shared/ui"
  import type { EventFormState } from "./event-form-state.svelte"
  import { REMINDER_OPTIONS } from "./labels"

  interface Props {
    form: EventFormState
    errorFor: (field: string) => string | undefined
  }

  let { form, errorFor }: Props = $props()
</script>

<!-- S06 Details: what, where, the reminder for everyone, and a note. -->
<FormField
  id="event-title"
  label="Title"
  placeholder="What are we planning?"
  maxlength={200}
  bind:value={form.title}
  error={errorFor("title")}
/>
<div class="grid gap-stack sm:grid-cols-2">
  <FormField
    id="event-location"
    label="Place"
    optional
    maxlength={300}
    bind:value={form.location}
    error={errorFor("location")}
  />
  <div class="flex flex-col gap-related">
    <SelectField
      id="event-reminder"
      label="Reminder"
      value={form.reminder}
      options={REMINDER_OPTIONS}
      onchange={(value) => (form.reminder = value)}
    />
    <p class="type-xs text-muted-foreground">
      {errorFor("reminders") ?? "Everyone invited can also set their own."}
    </p>
  </div>
</div>
<FormField id="event-description" label="Details" optional error={errorFor("description")}>
  {#snippet control({ id, describedby, invalid })}
    <Textarea
      {id}
      rows={3}
      placeholder="Anything your people should know…"
      aria-describedby={describedby}
      aria-invalid={invalid || undefined}
      bind:value={form.description}
    />
  {/snippet}
</FormField>
