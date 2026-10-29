<script lang="ts">
  import { UpcomingEvents } from "@/features/calendar"
  import { IdeasInProgress } from "@/features/ideas"
  import { UpcomingTasks } from "@/features/tasks"
  import { buildHash, type HomeCardId } from "@/shared/domain"
  import { SectionHeader } from "@/shared/ui"

  /** M01 "Up next": one row each from today's plans, ideas and tasks, in the owner's order. */
  let { spaceId, cards }: { spaceId: string; cards: readonly HomeCardId[] } = $props()
  const upNext = $derived(cards)
  const ideaHref = (ideaId: string, tab: "overview" | "tasks") =>
    buildHash({ name: "idea", spaceId, ideaId, tab })
</script>

<section class="flex flex-col gap-item">
  <SectionHeader title="Up next" />
  <div
    class="flex flex-col divide-y divide-border rounded-lg border border-border bg-card px-inset"
  >
    {#each upNext as id (id)}
      <div class="py-item">
        {#if id === "calendar"}<UpcomingEvents {spaceId} limit={1} />
        {:else if id === "ideas"}<IdeasInProgress
            {spaceId}
            ideaHref={(idea) => ideaHref(idea, "overview")}
            limit={1}
          />
        {:else}<UpcomingTasks
            {spaceId}
            taskHref={(idea) => ideaHref(idea, "tasks")}
            limit={1}
          />{/if}
      </div>
    {/each}
  </div>
</section>
