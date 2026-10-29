<script lang="ts">
  import type { Snippet } from "svelte"
  import { BudgetPanel } from "@/features/budget"
  import { MilestonesPanel, TasksTab } from "@/features/tasks"
  import { buildHash, canDelete, type IdeaTab, type Viewer } from "@/shared/domain"
  import { type Idea } from "../domain"
  import OverviewTab from "./OverviewTab.svelte"
  import { TAB_LABELS } from "./labels"
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

<!-- The section links above are a nav, not tabs, so this is a region named after its link and
     the idea ("Milestones for Tea bar"), which stays unique beside panels such as Milestones. -->
<section aria-label="{TAB_LABELS[tab]} for {idea.title}">
  {#if tab === "overview"}
    {#key idea.id}<OverviewTab {idea} onSaved={onChange} />{/key}
  {:else if tab === "research"}
    <ResearchTab {idea} {viewer} {attachments} />
  {:else if tab === "tasks"}
    <TasksTab
      spaceId={idea.spaceId}
      ideaId={idea.id}
      ideaTitle={idea.title}
      canDelete={deletable}
    />
  {:else if tab === "milestones"}
    <div class="grid items-start gap-columns lg:grid-cols-2">
      <MilestonesPanel
        spaceId={idea.spaceId}
        ideaId={idea.id}
        canDelete={deletable}
        tasksHref={buildHash({
          name: "idea",
          spaceId: idea.spaceId,
          ideaId: idea.id,
          tab: "tasks",
        })}
      />
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
</section>
