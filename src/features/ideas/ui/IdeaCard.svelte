<script lang="ts">
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { Badge } from "$lib/components/ui/badge"
  import { IDEA_STAGES, isShared, type Idea, type IdeaStage } from "../domain"
  import { STAGE_LABELS } from "./labels"
  import OursBadge from "./OursBadge.svelte"

  interface Props {
    idea: Idea
    href: string
    onMove: (stage: IdeaStage) => void
  }

  let { idea, href, onMove }: Props = $props()
</script>

<article class="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="idea-card">
  <a {href} class="font-medium hover:underline">{idea.title}</a>
  {#if idea.brief.pitch}<p class="line-clamp-2 text-sm text-muted-foreground">
      {idea.brief.pitch}
    </p>{/if}
  <div class="flex flex-wrap items-center gap-1">
    {#if isShared(idea)}<OursBadge />{/if}
    {#each idea.tags as tag (tag)}<Badge variant="secondary">{tag}</Badge>{/each}
  </div>
  <label class="flex items-center gap-2 text-xs text-muted-foreground">
    Stage
    <NativeSelect
      value={idea.stage}
      onchange={(event) => onMove(event.currentTarget.value as IdeaStage)}
    >
      {#each IDEA_STAGES as stage (stage)}<option value={stage}>{STAGE_LABELS[stage]}</option
        >{/each}
    </NativeSelect>
  </label>
</article>
