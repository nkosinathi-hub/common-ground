<script lang="ts">
  import { ChevronLeft, ChevronRight } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { memberName, type MemberRef } from "@/shared/domain"
  import { AvatarStack } from "@/shared/ui"
  import BoardCard from "@/shared/ui/board/BoardCard.svelte"
  import KanbanColumn from "@/shared/ui/board/KanbanColumn.svelte"
  import MoveMenu from "@/shared/ui/board/MoveMenu.svelte"
  import { groupByStage, IDEA_STAGES, peopleOf, type Idea, type IdeaStage } from "../domain"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    ideas: readonly Idea[]
    ideaHref: (id: string) => string
    onMove: (id: string, stage: IdeaStage) => void
    authors?: readonly MemberRef[]
  }

  /** Stages in view at once (D05); the pager shows the rest. */
  const SHOWN = 4

  let { ideas, ideaHref, onMove, authors = [] }: Props = $props()
  let first = $state(0)
  const columns = $derived(groupByStage(ideas))
  const visible = $derived(columns.slice(first, first + SHOWN))
  const hidden = $derived(columns.filter((_, i) => i < first || i >= first + SHOWN))
  const stages = IDEA_STAGES.map((id) => ({ id, title: STAGE_LABELS[id] }))
  const people = (idea: Idea) => peopleOf(idea).map((id) => ({ name: memberName(authors, id) }))
</script>

<!-- D05: the shared Kanban columns; drag a card, or use its menu to move it. -->
<div class="flex flex-col gap-stack" aria-label="Ideas board" role="group">
  <div class="flex snap-x gap-columns overflow-x-auto pb-1 contain-paint">
    {#each visible as column (column.stage)}
      <KanbanColumn
        id={column.stage}
        title={STAGE_LABELS[column.stage]}
        items={column.ideas}
        board="ideas"
        empty="New ideas land here."
        onmove={(id, stage) => onMove(id, stage as IdeaStage)}
      >
        {#snippet card(idea)}
          <BoardCard
            title={idea.title}
            href={ideaHref(idea.id)}
            description={idea.brief.pitch}
            tags={idea.tags}
          >
            {#snippet menu()}
              <MoveMenu
                subject={idea.title}
                columns={stages}
                current={idea.stage}
                heading="Move to stage"
                onmove={(stage) => onMove(idea.id, stage as IdeaStage)}
              />
            {/snippet}
            {#snippet footer()}
              <AvatarStack
                people={people(idea)}
                label="On this idea: {people(idea)
                  .map((p) => p.name)
                  .join(', ')}"
                size="sm"
              />
            {/snippet}
          </BoardCard>
        {/snippet}
      </KanbanColumn>
    {/each}
  </div>
  {#if columns.length > SHOWN}
    <div class="flex items-center gap-related">
      <p class="flex-1 type-sm text-muted-foreground">
        {hidden.length} more stages: {hidden.map((c) => STAGE_LABELS[c.stage]).join(", ")}
      </p>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Previous stages"
        disabled={first === 0}
        onclick={() => (first = Math.max(0, first - SHOWN))}><ChevronLeft /></Button
      >
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="More stages"
        disabled={first + SHOWN >= columns.length}
        onclick={() => (first = Math.min(columns.length - SHOWN, first + SHOWN))}
        ><ChevronRight /></Button
      >
    </div>
  {/if}
</div>
