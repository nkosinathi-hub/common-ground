<script lang="ts">
  import { ChevronRight } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { memberName, type MemberRef } from "@/shared/domain"
  import { AvatarStack } from "@/shared/ui"
  import MoveMenu from "@/shared/ui/board/MoveMenu.svelte"
  import { IDEA_STAGES, peopleOf, type Idea, type IdeaStage } from "../domain"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    idea: Idea
    href: string
    authors: readonly MemberRef[]
    onMove: (stage: IdeaStage) => void
  }

  let { idea, href, authors, onMove }: Props = $props()
  const people = $derived(peopleOf(idea).map((id) => memberName(authors, id)))
  const by = $derived(memberName(authors, idea.createdBy))
  const others = $derived(people.filter((name) => name !== by))
  const stages = IDEA_STAGES.map((id) => ({ id, title: STAGE_LABELS[id] }))
</script>

<!-- Figma Idea list card (211:10844): the whole card opens the idea; its menu moves it. -->
<article
  class="relative flex items-center gap-item rounded-lg border border-border bg-card p-card sm:gap-columns"
  data-testid="idea-card"
>
  <div class="flex min-w-0 flex-1 flex-col gap-related">
    <div class="flex flex-wrap items-center gap-related">
      <a
        {href}
        class="min-w-0 type-h3 text-foreground outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring/30"
        >{idea.title}</a
      >
      <Badge variant={idea.stage === "planning" ? "default" : "secondary"}
        >{STAGE_LABELS[idea.stage]}</Badge
      >
    </div>
    {#if idea.brief.pitch}<p class="line-clamp-1 type-sm text-muted-foreground">
        {idea.brief.pitch}
      </p>{/if}
    <div class="flex flex-wrap items-center gap-related">
      {#each idea.tags as tag (tag)}<Badge variant="outline">{tag}</Badge>{/each}
      <span class="type-xs text-muted-foreground"
        >Started by {by}{others.length ? ` · Shared with ${others.join(", ")}` : ""}</span
      >
    </div>
  </div>
  <!-- The byline already names everyone; phones keep the width for the title. -->
  <div class="max-sm:hidden">
    <AvatarStack
      people={people.map((name) => ({ name }))}
      label="On this idea: {people.join(', ')}"
    />
  </div>
  <div class="relative z-10">
    <MoveMenu
      subject={idea.title}
      columns={stages}
      current={idea.stage}
      heading="Move to stage"
      onmove={(stage) => onMove(stage as IdeaStage)}
    />
  </div>
  <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
</article>
