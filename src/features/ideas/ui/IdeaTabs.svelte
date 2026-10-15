<script lang="ts">
  import { IDEA_TABS, type IdeaTab } from "@/shared/domain"

  interface Props {
    current: IdeaTab
    href: (tab: IdeaTab) => string
  }

  const LABELS: Record<IdeaTab, string> = {
    overview: "Overview",
    research: "Research",
    tasks: "Tasks",
    milestones: "Milestones",
    discussion: "Discussion",
  }

  let { current, href }: Props = $props()
</script>

<nav aria-label="Idea sections" class="border-b">
  <ul class="flex gap-1 overflow-x-auto">
    {#each IDEA_TABS as tab (tab)}
      <li>
        <a
          href={href(tab)}
          aria-current={tab === current ? "page" : undefined}
          class="block border-b-2 px-3 py-2 text-sm whitespace-nowrap {tab === current
            ? 'border-primary font-medium'
            : 'border-transparent text-muted-foreground hover:text-foreground'}">{LABELS[tab]}</a
        >
      </li>
    {/each}
  </ul>
</nav>
