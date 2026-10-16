<script lang="ts">
  import { useAuth } from "@/features/auth"
  import { CalendarPage, EventDetail } from "@/features/calendar"
  import type { Space } from "@/features/spaces"

  let { space, eventId }: { space: Space; eventId: string | null } = $props()
  const { session } = useAuth()
  const me = $derived(session.user?.id ?? "")
  // spaces.week_starts_on reaches Space with the customisation work (#24); Monday until then.
  const weekStart = $derived((space as { weekStartsOn?: number }).weekStartsOn === 0 ? 0 : 1)
</script>

{#if eventId}
  {#key eventId}
    <EventDetail spaceId={space.id} {eventId} {me} isOwner={space.role === "owner"} />
  {/key}
{:else}
  <CalendarPage spaceId={space.id} {weekStart} />
{/if}
