<script lang="ts">
  import { Globe, MapPin, NotebookPen, Repeat } from "@lucide/svelte"
  import * as Card from "$lib/components/ui/card"
  import { DetailRow } from "@/shared/ui"
  import { formatWhen, type CalendarEvent } from "../domain"

  interface Props {
    event: CalendarEvent
    zone: string
  }

  let { event, zone }: Props = $props()
  const when = $derived(formatWhen(event.timing, event.timeZone, zone))
  // Planned elsewhere: the time where it was planned; else the same moment in UTC.
  const other = $derived(
    event.timing.allDay ? null : (when.zoneNote ?? formatWhen(event.timing, "UTC", "UTC").text),
  )
</script>

<!-- D14 Details: the other clock, where, every year and the note, one row each. -->
<Card.Root>
  <Card.Header><Card.Title>Details</Card.Title></Card.Header>
  <Card.Content class="flex flex-col">
    {#if other}
      <DetailRow
        icon={Globe}
        label={when.zoneNote ? "Where it was planned" : "In UTC"}
        value={other}
      />
    {/if}
    {#if event.repeatsYearly}<DetailRow icon={Repeat} label="Repeats" value="Every year" />{/if}
    {#if event.location}<DetailRow icon={MapPin} label="Place" value={event.location} />{/if}
    {#if event.description}
      <DetailRow icon={NotebookPen} label="Notes">
        <span class="whitespace-pre-line">{event.description}</span>
      </DetailRow>
    {/if}
    {#if !other && !event.repeatsYearly && !event.location && !event.description}
      <p class="type-sm text-muted-foreground">No place or notes yet.</p>
    {/if}
  </Card.Content>
</Card.Root>
