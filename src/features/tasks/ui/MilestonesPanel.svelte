<script lang="ts">
  import { untrack } from "svelte"
  import * as Card from "$lib/components/ui/card"
  import { Progress } from "$lib/components/ui/progress"
  import { AsyncView, FormError, PhoneAdd } from "@/shared/ui"
  import type { Milestone } from "../domain"
  import { useTasks } from "./context"
  import MilestoneForm from "./MilestoneForm.svelte"
  import MilestoneItem from "./MilestoneItem.svelte"
  import { MilestonesState } from "./milestones-state.svelte"

  interface Props {
    spaceId: string
    ideaId: string
    /** Whether the viewer may delete a row by this author (the author or the space owner). */
    canDelete: (createdBy: string | null) => boolean
    /** The idea's tasks tab, where each milestone's linked tasks are. */
    tasksHref?: string
  }

  let { spaceId, ideaId, canDelete, tasksHref = "" }: Props = $props()
  const plan = new MilestonesState(useTasks(), () => ({ spaceId, ideaId }))
  let editing = $state<Milestone | null>(null)
  // Reloads when the page shows another idea.
  $effect(() => {
    void ideaId
    untrack(() => void plan.load())
  })
</script>

<!-- D10 left column: the milestones with their progress, then add or edit one. -->
<div class="flex flex-col gap-stack">
  <Card.Root role="region" aria-labelledby="milestones-heading">
    <Card.Header>
      <Card.Title id="milestones-heading">Milestones</Card.Title>
      <Card.Action class="flex items-center gap-related">
        <span class="type-xs text-muted-foreground"
          >{plan.progress.done} of {plan.progress.total} done</span
        >
        <Progress
          value={plan.progress.total ? (plan.progress.done / plan.progress.total) * 100 : 0}
          class="h-1.5 w-20"
          aria-hidden="true"
        />
      </Card.Action>
    </Card.Header>
    <Card.Content>
      <AsyncView resource={plan.list}>
        {#snippet children(items)}
          <ul class="flex flex-col divide-y divide-border">
            {#each items as milestone (milestone.id)}
              <MilestoneItem
                {milestone}
                linked={plan.linkedTo(milestone)}
                {tasksHref}
                onToggle={(done) => plan.toggle(milestone, done)}
                onEdit={() => (editing = milestone)}
              />
            {:else}
              <li class="type-sm text-muted-foreground">No milestones yet.</li>
            {/each}
          </ul>
        {/snippet}
      </AsyncView>
      <FormError message={editing ? null : plan.error?.message} />
    </Card.Content>
  </Card.Root>
  {#if editing}
    {#key editing.id}
      <MilestoneForm
        milestone={editing}
        deletable={canDelete(editing.createdBy)}
        error={plan.error}
        onSave={(input, done) => plan.save(editing!, input, done)}
        onCancel={() => (editing = null)}
        onRemove={() => void plan.remove(editing!.id).then(() => (editing = null))}
      />
    {/key}
  {:else}
    <PhoneAdd label="Add milestone" variant="block">
      <MilestoneForm error={plan.error} onSave={(input) => plan.add(input)} />
    </PhoneAdd>
  {/if}
</div>
