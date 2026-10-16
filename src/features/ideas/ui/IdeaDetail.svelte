<script lang="ts">
  import type { Snippet } from "svelte"
  import { BudgetPanel } from "@/features/budget"
  import { MilestonesPanel, TasksTab } from "@/features/tasks"
  import { ErrorState, Loading } from "@/shared/ui"
  import {
    appError,
    buildHash,
    err,
    type AppError,
    type IdeaTab,
    type Result,
  } from "@/shared/domain"
  import { canDelete, type Idea, type Viewer } from "../domain"
  import { useIdeas } from "./context"
  import IdeaHeader from "./IdeaHeader.svelte"
  import IdeaTabs from "./IdeaTabs.svelte"
  import OverviewTab from "./OverviewTab.svelte"
  import ResearchTab from "./ResearchTab.svelte"

  interface Props {
    spaceId: string
    ideaId: string
    tab: IdeaTab
    tabHref: (tab: IdeaTab) => string
    /** The signed-in member; delete buttons show only for their own work, or to the owner. */
    viewer: Viewer
    /** Comments thread for this idea (collaboration feature). */
    discussion?: Snippet<[Idea]>
    /** Attachment list for the research tab (attachments feature). */
    attachments?: Snippet<[Idea]>
    /** After the idea is deleted; by default goes back to the space's ideas list. */
    onDeleted?: () => void
  }

  let { spaceId, ideaId, tab, tabHref, viewer, discussion, attachments, onDeleted }: Props =
    $props()

  const ideas = useIdeas()
  let idea = $state<Idea | null>(null)
  let error = $state<AppError | null>(null)

  /** An idea is only shown under the space in the URL, so links never cross spaces. */
  function inThisSpace(result: Result<Idea>): Result<Idea> {
    if (!result.ok || result.value.spaceId === spaceId) return result
    return err(appError("not_found", "That idea is not in this space"))
  }

  async function load() {
    const result = inThisSpace(await ideas.get(ideaId))
    idea = result.ok ? result.value : null
    error = result.ok ? null : result.error
  }
  // Loads on mount, and again if ideaId changes: load reads it before its first await.
  $effect(() => {
    load()
  })

  const backToList = () => (location.hash = buildHash({ name: "ideas", spaceId }))
  const deleted = () => (onDeleted ?? backToList)()
  const deletable = (createdBy: string | null) => canDelete(createdBy, viewer)
  function setCurrency(currency: string) {
    if (idea) idea = { ...idea, currency }
  }
</script>

{#if error}
  <ErrorState {error} onRetry={load} />
{:else if !idea}
  <Loading label="Loading idea" />
{:else}
  <div class="flex flex-col gap-4">
    <IdeaHeader {idea} {viewer} onChange={(next) => (idea = next)} onDeleted={deleted} />
    <IdeaTabs current={tab} href={tabHref} />
    <div role="tabpanel" tabindex="0" aria-label={tab}>
      {#if tab === "overview"}
        {#key idea.id}<OverviewTab {idea} onSaved={(next) => (idea = next)} />{/key}
      {:else if tab === "research"}
        <ResearchTab {idea} {viewer} {attachments} />
      {:else if tab === "tasks"}
        <TasksTab spaceId={idea.spaceId} ideaId={idea.id} canDelete={deletable} />
      {:else if tab === "milestones"}
        <div class="grid gap-6 lg:grid-cols-2">
          <MilestonesPanel spaceId={idea.spaceId} ideaId={idea.id} canDelete={deletable} />
          <BudgetPanel
            spaceId={idea.spaceId}
            ideaId={idea.id}
            currency={idea.currency}
            canDelete={deletable}
            onCurrencyChanged={setCurrency}
          />
        </div>
      {:else if tab === "discussion"}
        {@render discussion?.(idea)}
      {/if}
    </div>
  </div>
{/if}
