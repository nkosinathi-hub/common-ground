<script lang="ts">
  import type { Snippet } from "svelte"
  import { TasksTab } from "@/features/tasks"
  import { ErrorState, Loading } from "@/shared/ui"
  import { appError, type AppError } from "@/shared/domain"
  import type { Idea } from "../domain"
  import { useIdeas } from "./context"
  import IdeaHeader from "./IdeaHeader.svelte"
  import IdeaTabs, { type IdeaTab } from "./IdeaTabs.svelte"
  import OverviewTab from "./OverviewTab.svelte"
  import ResearchTab from "./ResearchTab.svelte"

  let {
    spaceId,
    ideaId,
    tab,
    tabHref,
    discussion,
    attachments,
  }: {
    spaceId: string
    ideaId: string
    tab: IdeaTab
    tabHref: (tab: IdeaTab) => string
    /** Comments thread for this idea (collaboration feature). */
    discussion?: Snippet<[Idea]>
    /** Attachment list for the research tab (attachments feature). */
    attachments?: Snippet<[Idea]>
  } = $props()

  const ideas = useIdeas()
  let idea = $state<Idea | null>(null)
  let error = $state<AppError | null>(null)

  async function load() {
    const result = await ideas.get(ideaId)
    // An idea is only shown under the space in the URL, so links never cross spaces.
    const found = result.ok && result.value.spaceId === spaceId ? result.value : null
    idea = found
    error = found
      ? null
      : result.ok
        ? appError("not_found", "That idea is not in this space")
        : result.error
  }
  $effect(() => {
    void load()
  })
</script>

{#if error}
  <ErrorState {error} onRetry={load} />
{:else if !idea}
  <Loading label="Loading idea" />
{:else}
  <div class="flex flex-col gap-4">
    <IdeaHeader {idea} onChange={(next) => (idea = next)} />
    <IdeaTabs current={tab} href={tabHref} />
    <div role="tabpanel" tabindex="0" aria-label={tab}>
      {#if tab === "overview"}
        {#key idea.id}<OverviewTab {idea} onSaved={(next) => (idea = next)} />{/key}
      {:else if tab === "research"}
        <ResearchTab {idea} {attachments} />
      {:else if tab === "tasks"}
        <TasksTab spaceId={idea.spaceId} ideaId={idea.id} />
      {:else if tab === "discussion"}
        {@render discussion?.(idea)}
      {/if}
    </div>
  </div>
{/if}
