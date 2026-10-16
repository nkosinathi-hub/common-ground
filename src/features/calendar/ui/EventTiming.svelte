<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Switch } from "$lib/components/ui/switch"
  import { timeZones } from "../domain"
  import type { EventFormState } from "./event-form.svelte"
  import FieldError from "./FieldError.svelte"

  interface Props {
    form: EventFormState
    errorFor: (field: string) => string | undefined
  }

  let { form, errorFor }: Props = $props()
  const zones = $derived(timeZones(form.timeZone))
</script>

<div class="flex items-center gap-2">
  <Switch id="event-all-day" bind:checked={form.allDay} />
  <Label for="event-all-day">All day</Label>
</div>
<div class="grid grid-cols-2 gap-3">
  <div class="grid gap-1.5">
    <Label for="event-start-date">Starts</Label>
    <Input
      id="event-start-date"
      type="date"
      value={form.startDate}
      oninput={(event) => form.setStartDate(event.currentTarget.value)}
    />
    <FieldError message={errorFor("startDate")} />
  </div>
  {#if !form.allDay}
    <div class="grid gap-1.5">
      <Label for="event-start-time">Start time</Label>
      <Input id="event-start-time" type="time" bind:value={form.startTime} />
      <FieldError message={errorFor("startTime")} />
    </div>
  {/if}
  <div class="grid gap-1.5">
    <Label for="event-end-date">Ends</Label>
    <Input id="event-end-date" type="date" bind:value={form.endDate} />
    <FieldError message={errorFor("endDate")} />
  </div>
  {#if !form.allDay}
    <div class="grid gap-1.5">
      <Label for="event-end-time">End time</Label>
      <Input id="event-end-time" type="time" bind:value={form.endTime} />
      <FieldError message={errorFor("endTime")} />
    </div>
  {/if}
</div>
{#if form.allDay && form.canRepeat}
  <div class="flex items-center gap-2">
    <Switch id="event-yearly" bind:checked={form.repeatsYearly} />
    <Label for="event-yearly">Every year (birthdays, anniversaries)</Label>
  </div>
{/if}
<FieldError message={errorFor("repeatsYearly")} />
<div class="grid gap-1.5">
  <Label for="event-zone">Time zone</Label>
  <select
    id="event-zone"
    class="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
    bind:value={form.timeZone}
  >
    {#each zones as zone (zone)}<option value={zone}>{zone.replaceAll("_", " ")}</option>{/each}
  </select>
  <FieldError message={errorFor("timeZone")} />
</div>
