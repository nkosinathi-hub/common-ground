<script lang="ts">
  import type { Space } from "@/features/spaces"
  import { EmptyState } from "@/shared/ui"

  // Placeholder until the calendar feature lands (#29); keeps the route and nav section live.
  let { space, eventId }: { space: Space; eventId: string | null } = $props()
</script>

<h1 class="mb-4 text-2xl font-semibold">Calendar</h1>
<EmptyState
  title="Plans for {space.name} will live here"
  description={eventId
    ? "This plan is not available yet."
    : "Dates, events and reminders are on the way."}
/>
