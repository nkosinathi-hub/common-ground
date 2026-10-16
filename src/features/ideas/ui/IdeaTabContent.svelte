<script lang="ts">
  import type { Snippet } from "svelte"
  import { BudgetPanel } from "@/features/budget"
  import { MilestonesPanel, TasksTab } from "@/features/tasks"
  import type { IdeaTab } from "@/shared/domain"
  import { canDelete, type Idea, type Viewer } from "../domain"
  import OverviewTab from "./OverviewTab.svelte"
  import ResearchTab from "./ResearchTab.svelte"

  interface Props {
    idea: Idea
    tab: IdeaTab
    viewer: Viewer
    discussion?: Snippet<[Idea]>
    attachments?: Snippet<[Idea]>
    onChange: (idea: Idea) => void
  }

  let { idea, tab, viewer, discussion, attachments, onChange }: Props = $props()
  const deletable = (createdBy: string | null) => canDelete(createdBy, viewer)
  const setCurrency = (currency: string) => onChange({ ...idea, currency })
</script>

<div role="tabpanel" tabindex="0" aria-label={tab}>
  {#if tab === "overview"}
    {#key idea.id}<OverviewTab {idea} onSaved={onChange} />{/key}
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
