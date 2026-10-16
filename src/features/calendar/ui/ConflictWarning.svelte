<script lang="ts">
  import { untrack } from "svelte"
  import { TriangleAlert } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { Resource } from "@/shared/ui"
  import { conflicts, coveredDays, type CalendarEvent } from "../domain"
  import { useCalendar } from "./context"

  interface Props {
    event: CalendarEvent
    spaceId: string
    zone: string
  }

  let { event, spaceId, zone }: Props = $props()
  const { service } = useCalendar()
  const window = new Resource(() => {
    const current = untrack(() => event)
    return service.range(
      untrack(() => spaceId),
      ...coveredDays(current.timing, zone),
      zone,
    )
  })
  $effect(() => {
    void event.timing
    void window.load()
  })
  const clashes = $derived(conflicts(event, window.value?.entries ?? [], zone))
</script>

{#if clashes.length}
  <Alert.Root data-testid="event-conflict">
    <TriangleAlert aria-hidden="true" />
    <Alert.Title>This overlaps with something you are going to</Alert.Title>
    <Alert.Description>{clashes.map((clash) => clash.title).join(", ")}</Alert.Description>
  </Alert.Root>
{/if}
