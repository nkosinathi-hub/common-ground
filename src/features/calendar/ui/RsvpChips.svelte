<script lang="ts">
  import * as ToggleGroup from "$lib/components/ui/toggle-group"
  import { toast } from "@/shared/ui"
  import { RSVP_ANSWERS, rsvpSummary, type CalendarEvent, type RsvpAnswer } from "../domain"
  import { useCalendar } from "./context"
  import { RSVP_LABELS } from "./labels"

  interface Props {
    event: CalendarEvent
    me: string
    nameOf: (userId: string) => string
    onAnswered: () => void
  }

  let { event, me, nameOf, onAnswered }: Props = $props()
  const { service } = useCalendar()
  const summary = $derived(rsvpSummary(event.attendees, me, nameOf))
  const mine = $derived(summary.mine === "pending" ? "" : (summary.mine ?? ""))
  let busy = $state(false)

  async function answer(value: string) {
    if (!value || value === mine) return
    busy = true
    const result = await service.rsvp(event.id, value as RsvpAnswer)
    busy = false
    if (!result.ok) return toast.error(result.error.message)
    onAnswered()
  }
</script>

<section aria-labelledby="rsvp-heading" class="flex flex-col gap-2">
  <h2 id="rsvp-heading" class="text-lg font-semibold">Are you going?</h2>
  <ToggleGroup.Root
    type="single"
    variant="outline"
    value={mine}
    onValueChange={answer}
    disabled={busy}
    aria-label="Your answer"
    class="justify-start"
  >
    {#each RSVP_ANSWERS as option (option)}
      <ToggleGroup.Item value={option}>
        {RSVP_LABELS[option]} <span>({summary[option].length})</span>
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
  <dl class="grid gap-1 text-sm" data-testid="rsvp-names">
    {#each [...RSVP_ANSWERS, "pending" as const] as group (group)}
      {#if summary[group].length}
        <div class="flex gap-2">
          <dt class="font-medium">{group === "pending" ? "Not answered" : RSVP_LABELS[group]}:</dt>
          <dd>{summary[group].join(", ")}</dd>
        </div>
      {/if}
    {/each}
  </dl>
</section>
