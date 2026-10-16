<script lang="ts">
  import { Clock, Globe, Link as LinkIcon, MapPin, Repeat } from "@lucide/svelte"
  import { formatWhen, type CalendarEvent } from "../domain"
  import { linkHref } from "./links"

  interface Props {
    event: CalendarEvent
    zone: string
    spaceId: string
  }

  let { event, zone, spaceId }: Props = $props()
  const when = $derived(formatWhen(event.timing, event.timeZone, zone))
  const link = $derived(event.link)
  const href = $derived(link ? linkHref(spaceId, link) : null)
  const KIND = { watch_item: "Watch", idea: "Idea", task: "Task" } as const
</script>

<header class="flex flex-col gap-2">
  <h1 class="text-2xl font-semibold">{event.title}</h1>
  <p class="flex items-center gap-2" data-testid="event-when">
    <Clock class="size-4 shrink-0" aria-hidden="true" />{when.text}
  </p>
  {#if when.zoneNote}
    <p class="flex items-center gap-2 text-sm text-muted-foreground">
      <Globe class="size-4 shrink-0" aria-hidden="true" />{when.zoneNote}
    </p>
  {/if}
  {#if event.repeatsYearly}
    <p class="flex items-center gap-2 text-sm">
      <Repeat class="size-4" aria-hidden="true" />Every year
    </p>
  {/if}
  {#if event.location}
    <p class="flex items-center gap-2">
      <MapPin class="size-4 shrink-0" aria-hidden="true" /><span class="sr-only">Where:</span>
      {event.location}
    </p>
  {/if}
  {#if link}
    <p class="flex items-center gap-2 text-sm">
      <LinkIcon class="size-4 shrink-0" aria-hidden="true" />{KIND[link.kind]}:
      {#if href}<a {href} class="underline underline-offset-4">{link.label}</a
        >{:else}{link.label}{/if}
    </p>
  {/if}
  {#if event.description}<p class="whitespace-pre-line text-muted-foreground">
      {event.description}
    </p>{/if}
</header>
