<script lang="ts">
  import { Check } from "@lucide/svelte"
  import type { MemberRef } from "@/shared/domain"
  import { Chip } from "@/shared/ui"
  import type { EventFormState } from "./event-form-state.svelte"
  import FieldError from "./FieldError.svelte"
  import LinkPicker from "./LinkPicker.svelte"
  import WatchNightPicker from "./WatchNightPicker.svelte"

  interface Props {
    form: EventFormState
    spaceId: string
    members: readonly MemberRef[]
    /** New events can be a watch night: the picker fills the title, time and link. */
    watchNight: boolean
    errorFor: (field: string) => string | undefined
  }

  let { form, spaceId, members, watchNight, errorFor }: Props = $props()
</script>

<!-- S06c People: who is invited as chips, beside what the plan is for. -->
<div class="grid gap-section sm:grid-cols-2">
  <fieldset class="flex flex-col gap-related">
    <legend class="mb-related type-label text-foreground">Who's invited?</legend>
    <div class="flex flex-wrap gap-related">
      {#each members as member (member.id)}
        {@const on = form.attendees.includes(member.id)}
        <Chip
          selected={on}
          icon={on ? Check : undefined}
          onclick={() => form.toggleAttendee(member.id, !on)}>{member.displayName}</Chip
        >
      {/each}
    </div>
    <FieldError message={errorFor("attendees")} />
  </fieldset>
  <div class="flex flex-col gap-related">
    <LinkPicker {spaceId} bind:value={form.link} />
    {#if watchNight}<WatchNightPicker
        {spaceId}
        onPick={(title) => form.planWatchNight(title)}
      />{/if}
  </div>
</div>
