<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import type { MemberRef, Result } from "@/shared/domain"
  import { DeleteButton } from "@/shared/ui"
  import {
    canDelete,
    IDEA_STAGES,
    TITLE_MAX,
    type Idea,
    type IdeaStage,
    type Viewer,
  } from "../domain"
  import { useIdeas } from "./context"
  import IdeaByline from "./IdeaByline.svelte"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    idea: Idea
    viewer: Viewer
    members: readonly MemberRef[]
    onChange: (idea: Idea) => void
    /** After invites or removals: the idea is reloaded with its people. */
    onPeopleChanged: () => void
    onDeleted: () => void
  }

  let { idea, viewer, members, onChange, onPeopleChanged, onDeleted }: Props = $props()
  const ideas = useIdeas().service
  let error = $state<string | null>(null)

  async function apply(change: Promise<Result<Idea>>) {
    const result = await change
    error = result.ok ? null : result.error.message
    if (result.ok) onChange(result.value)
  }
  /** Offered to the author and the owner only; a server refusal (a stale role) is shown here. */
  async function remove() {
    const result = await ideas.remove(idea.id)
    error = result.ok ? null : result.error.message
    if (result.ok) onDeleted()
  }
  const tagsOf = (text: string) => text.split(",")
</script>

<header class="flex flex-col gap-2">
  <h1 class="sr-only">{idea.title}</h1>
  <div class="flex items-center gap-2">
    <label class="sr-only" for="idea-title">Title</label>
    <Input
      id="idea-title"
      class="h-10 text-xl font-semibold"
      value={idea.title}
      maxlength={TITLE_MAX}
      onchange={(event) => apply(ideas.rename(idea.id, event.currentTarget.value))}
    />
    {#if canDelete(idea.createdBy, viewer)}
      <DeleteButton
        label="Delete idea"
        what="this idea"
        description="Its notes, links, tasks, budget and discussion go with it. This cannot be undone."
        size="icon-sm"
        onConfirm={remove}
      />
    {/if}
  </div>
  <IdeaByline {idea} {members} {onPeopleChanged} />
  <div class="flex flex-wrap items-center gap-2 text-sm">
    <label class="flex items-center gap-2"
      >Stage
      <select
        class="h-8 rounded-lg border border-input bg-background px-2"
        value={idea.stage}
        onchange={(event) =>
          apply(ideas.moveStage(idea.id, event.currentTarget.value as IdeaStage))}
      >
        {#each IDEA_STAGES as stage (stage)}<option value={stage}>{STAGE_LABELS[stage]}</option
          >{/each}
      </select>
    </label>
    <label class="flex grow items-center gap-2"
      >Tags
      <Input
        class="max-w-sm"
        value={idea.tags.join(", ")}
        placeholder="food, pop-up"
        onchange={(event) => apply(ideas.setTags(idea.id, tagsOf(event.currentTarget.value)))}
      />
    </label>
  </div>
  {#if error}<p class="text-sm text-destructive" role="alert">{error}</p>{/if}
</header>
