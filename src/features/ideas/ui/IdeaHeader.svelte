<script lang="ts">
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { Input } from "$lib/components/ui/input"
  import { canDelete, type MemberRef, type Result, TITLE_MAX, type Viewer } from "@/shared/domain"
  import { DeleteButton, FormError } from "@/shared/ui"
  import { IDEA_STAGES, type Idea, type IdeaStage } from "../domain"
  import { useIdeas } from "./context"
  import IdeaByline from "./IdeaByline.svelte"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    idea: Idea
    viewer: Viewer
    /** Current members, offered as collaborators. */
    members: readonly MemberRef[]
    /** Names for the byline, including removed people still visible. */
    authors: readonly MemberRef[]
    onChange: (idea: Idea) => void
    /** After invites or removals: the idea is reloaded with its people. */
    onPeopleChanged: () => void
    onDeleted: () => void
  }

  let { idea, viewer, members, authors, onChange, onPeopleChanged, onDeleted }: Props = $props()
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
        onConfirm={remove}
      />
    {/if}
  </div>
  <IdeaByline {idea} {members} {authors} {onPeopleChanged} />
  <div class="flex flex-wrap items-center gap-2 text-sm">
    <label class="flex items-center gap-2"
      >Stage
      <NativeSelect
        value={idea.stage}
        onchange={(event) =>
          apply(ideas.moveStage(idea.id, event.currentTarget.value as IdeaStage))}
      >
        {#each IDEA_STAGES as stage (stage)}<option value={stage}>{STAGE_LABELS[stage]}</option
          >{/each}
      </NativeSelect>
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
  <FormError message={error} />
</header>
