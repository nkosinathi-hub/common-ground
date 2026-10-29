<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { Switch } from "$lib/components/ui/switch"
  import { FormField } from "@/shared/ui"
  import type { DateOnly } from "@/shared/domain"
  import { formatWhen, timeZones, toInstant, utcOffset } from "../domain"
  import type { EventFormState } from "./event-form-state.svelte"
  import FieldError from "./FieldError.svelte"

  interface Props {
    form: EventFormState
    errorFor: (field: string) => string | undefined
  }

  let { form, errorFor }: Props = $props()
  const zones = $derived(timeZones(form.timeZone))
  const zoneLabel = (zone: string) =>
    `${zone.replaceAll("_", " ")} (${utcOffset(zone, Date.now())})`
  // The same moment in UTC, so a plan across zones is never misread.
  const inUtc = $derived.by(() => {
    if (form.allDay || !form.startDate || !form.startTime || !form.endTime) return null
    try {
      const startsAt = toInstant(form.startDate as DateOnly, form.startTime, form.timeZone)
      const endsAt = toInstant(
        (form.endDate || form.startDate) as DateOnly,
        form.endTime,
        form.timeZone,
      )
      return `That is ${formatWhen({ allDay: false, startsAt, endsAt }, "UTC", "UTC").text} UTC.`
    } catch {
      return null
    }
  })
</script>

<!-- S06b When: all day and every year, the start and end, and the zone it is planned in. -->
<div class="flex flex-wrap items-center gap-columns">
  <div class="flex items-center gap-related">
    <Label for="event-all-day">All day</Label>
    <Switch id="event-all-day" bind:checked={form.allDay} />
  </div>
  <div class="flex items-center gap-related">
    <Label for="event-yearly">Every year</Label>
    <Switch
      id="event-yearly"
      checked={form.repeatsYearly && form.canRepeat}
      onCheckedChange={(on) => form.setYearly(on)}
    />
  </div>
</div>
<FieldError message={errorFor("repeatsYearly")} />
<div class="grid grid-cols-2 gap-stack sm:grid-cols-4">
  <FormField id="event-start-date" label="Starts" error={errorFor("startDate")}>
    {#snippet control({ id, describedby })}
      <Input
        {id}
        type="date"
        aria-describedby={describedby}
        value={form.startDate}
        oninput={(event) => form.setStartDate(event.currentTarget.value)}
      />
    {/snippet}
  </FormField>
  {#if !form.allDay}
    <FormField
      id="event-start-time"
      label="Start time"
      type="time"
      bind:value={form.startTime}
      error={errorFor("startTime")}
    />
  {/if}
  <FormField
    id="event-end-date"
    label="Ends"
    type="date"
    bind:value={form.endDate}
    error={errorFor("endDate")}
  />
  {#if !form.allDay}
    <FormField
      id="event-end-time"
      label="End time"
      type="time"
      bind:value={form.endTime}
      error={errorFor("endTime")}
    />
  {/if}
</div>
<FormField id="event-zone" label="Time zone" error={errorFor("timeZone")} hint={inUtc ?? undefined}>
  {#snippet control({ id, describedby })}
    <NativeSelect {id} class="w-full" aria-describedby={describedby} bind:value={form.timeZone}>
      {#each zones as zone (zone)}<option value={zone}>{zoneLabel(zone)}</option>{/each}
    </NativeSelect>
  {/snippet}
</FormField>
