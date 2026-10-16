<script lang="ts">
  import { CalendarPage, EventDetail } from "@/features/calendar"
  import type { Space } from "@/features/spaces"

  interface Props {
    space: Space
    /** The signed-in member's id. */
    me: string
    eventId: string | null
  }

  let { space, me, eventId }: Props = $props()
  // spaces.week_starts_on reaches Space with the customisation work (#24); Monday until then.
  const weekStart = $derived(space.weekStartsOn)
</script>

{#if eventId}
  {#key eventId}
    <EventDetail spaceId={space.id} {eventId} {me} isOwner={space.role === "owner"} />
  {/key}
{:else}
  <CalendarPage spaceId={space.id} {weekStart} />
{/if}
