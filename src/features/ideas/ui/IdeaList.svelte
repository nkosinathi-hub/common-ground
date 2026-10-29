<script lang="ts">
  import * as Alert from "$lib/components/ui/alert"
  import type { MemberRef } from "@/shared/domain"
  import type { Idea, IdeaStage } from "../domain"
  import IdeaListCard from "./IdeaListCard.svelte"

  interface Props {
    ideas: readonly Idea[]
    ideaHref: (ideaId: string) => string
    authors: readonly MemberRef[]
    onMove: (id: string, stage: IdeaStage) => void
  }

  let { ideas, ideaHref, authors, onMove }: Props = $props()
</script>

<!-- D04 list view: one card per idea, then the note that stages never lose work. -->
<div class="flex flex-col gap-stack">
  {#each ideas as idea (idea.id)}
    <IdeaListCard
      {idea}
      href={ideaHref(idea.id)}
      {authors}
      onMove={(stage) => onMove(idea.id, stage)}
    />
  {:else}
    <p class="type-sm text-muted-foreground">No ideas match these filters.</p>
  {/each}
</div>
<Alert.Root variant="secondary">
  <Alert.Description>
    Every idea has room to evolve. Change its stage without losing research, tasks or discussion.
  </Alert.Description>
</Alert.Root>
