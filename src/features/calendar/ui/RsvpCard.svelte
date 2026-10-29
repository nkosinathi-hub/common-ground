<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import * as Card from "$lib/components/ui/card"
  import * as ToggleGroup from "$lib/components/ui/toggle-group"
  import { InitialAvatar, toast } from "@/shared/ui"
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

<!-- D14 "Are you going?": your answer as a segmented choice with counts, then everyone's. -->
<Card.Root role="region" aria-labelledby="rsvp-heading">
  <Card.Header>
    <Card.Title id="rsvp-heading">Are you going?</Card.Title>
    <Card.Description>Your answer is shared with everyone in the space.</Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    <ToggleGroup.Root
      type="single"
      variant="segment"
      spacing={1}
      value={mine}
      onValueChange={answer}
      disabled={busy}
      aria-label="Your answer"
      class="w-fit!"
    >
      {#each RSVP_ANSWERS as option (option)}
        <ToggleGroup.Item value={option}>
          {RSVP_LABELS[option]} · {summary[option].length}
        </ToggleGroup.Item>
      {/each}
    </ToggleGroup.Root>
    <ul class="flex flex-col" data-testid="rsvp-names">
      {#each event.attendees as attendee (attendee.userId)}
        <li class="flex items-center gap-item py-related">
          <InitialAvatar
            name={nameOf(attendee.userId)}
            tone={attendee.userId === me ? "brand" : "secondary"}
            decorative
          />
          <span class="min-w-0 flex-1 truncate type-label text-foreground">
            {nameOf(attendee.userId)}{attendee.userId === me ? " (you)" : ""}
          </span>
          <Badge variant={attendee.rsvp === "going" ? "secondary" : "outline"}>
            {attendee.rsvp === "pending" ? "Not answered" : RSVP_LABELS[attendee.rsvp]}
          </Badge>
        </li>
      {/each}
    </ul>
  </Card.Content>
</Card.Root>
