<script lang="ts">
  import { groupByStage, type Idea, type IdeaStage } from "../domain"
  import IdeaCard from "./IdeaCard.svelte"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    ideas: readonly Idea[]
    ideaHref: (id: string) => string
    onMove: (id: string, stage: IdeaStage) => void
  }

  let { ideas, ideaHref, onMove }: Props = $props()
</script>

<div class="flex snap-x gap-3 overflow-x-auto pb-2" aria-label="Ideas board">
  {#each groupByStage(ideas) as column (column.stage)}
    <section
      class="flex w-64 shrink-0 snap-start flex-col gap-2 rounded-lg bg-muted/40 p-2"
      aria-label={STAGE_LABELS[column.stage]}
    >
      <h3 class="text-sm font-semibold">
        {STAGE_LABELS[column.stage]}
        <span class="text-muted-foreground">({column.ideas.length})</span>
      </h3>
      {#each column.ideas as idea (idea.id)}
        <IdeaCard {idea} href={ideaHref(idea.id)} onMove={(stage) => onMove(idea.id, stage)} />
      {/each}
    </section>
  {/each}
</div>
