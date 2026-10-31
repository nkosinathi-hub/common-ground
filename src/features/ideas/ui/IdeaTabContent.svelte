<script lang="ts">
  import type { Snippet } from "svelte"
  import { BudgetPanel } from "@/features/budget"
  import { MilestonesPanel, TasksTab } from "@/features/tasks"
  import { buildHash, canDelete, type IdeaTab, type MemberRef, type Viewer } from "@/shared/domain"
  import { type Idea } from "../domain"
  import IdeaGlance from "./IdeaGlance.svelte"
  import IdeaPeopleCard from "./IdeaPeopleCard.svelte"
  import OverviewTab from "./OverviewTab.svelte"
  import TemplateCard from "./TemplateCard.svelte"
  import { TAB_LABELS } from "./labels"
  import ResearchTab from "./ResearchTab.svelte"

  interface Props {
    idea: Idea
    tab: IdeaTab
    viewer: Viewer
    discussion?: Snippet<[Idea]>
    attachments?: Snippet<[Idea]>
    /** At a glance rows the plan features own (milestone, tasks, budget). */
    glance?: Snippet<[Idea]>
    /** Names for the At a glance people. */
    authors: readonly MemberRef[]
    onChange: (idea: Idea) => void
  }

  let { idea, tab, viewer, discussion, attachments, glance, authors, onChange }: Props = $props()
  const deletable = (createdBy: string | null) => canDelete(createdBy, viewer)
  const setCurrency = (currency: string) => onChange({ ...idea, currency })
</script>

<!-- The section links above are a nav, not tabs, so this is a region named after its link and
     the idea ("Milestones for Tea bar"), which stays unique beside panels such as Milestones. -->
<section aria-label="{TAB_LABELS[tab]} for {idea.title}">
  {#if tab === "overview"}
    <!-- D06: the plan and its details beside At a glance and the template. -->
    <div class="grid items-start gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]">
      {#key idea.id}<OverviewTab {idea} onSaved={onChange} />{/key}
      <aside class="flex flex-col gap-stack" aria-label="About this idea">
        <IdeaGlance {idea} {authors} rows={glance} /><TemplateCard {idea} {onChange} />
      </aside>
    </div>
  {:else if tab === "research"}
    <ResearchTab {idea} {viewer} {attachments} {authors} />
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
    <!-- D11: the conversation beside who is in on it. -->
    <div class="grid items-start gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]">
      <div class="min-w-0">{@render discussion?.(idea)}</div>
      <aside aria-label="People"><IdeaPeopleCard {idea} {authors} /></aside>
    </div>
  {/if}
</section>
