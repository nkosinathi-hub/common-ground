<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import { IDEA_STAGES, type Idea, type IdeaStage } from "../domain"
  import { STAGE_LABELS } from "./labels"

  let { idea, href, onMove }: { idea: Idea; href: string; onMove: (stage: IdeaStage) => void } =
    $props()
</script>

<article class="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="idea-card">
  <a {href} class="font-medium hover:underline">{idea.title}</a>
  {#if idea.brief.pitch}<p class="line-clamp-2 text-sm text-muted-foreground">
      {idea.brief.pitch}
    </p>{/if}
  <div class="flex flex-wrap items-center gap-1">
    {#each idea.tags as tag (tag)}<Badge variant="secondary">{tag}</Badge>{/each}
  </div>
  <label class="flex items-center gap-2 text-xs text-muted-foreground">
    Stage
    <select
      class="h-7 rounded-md border border-input bg-background px-1 text-xs"
      value={idea.stage}
      onchange={(e) => onMove(e.currentTarget.value as IdeaStage)}
    >
      {#each IDEA_STAGES as stage (stage)}<option value={stage}>{STAGE_LABELS[stage]}</option
        >{/each}
    </select>
  </label>
</article>
