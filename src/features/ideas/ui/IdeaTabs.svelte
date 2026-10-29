<script lang="ts">
  import { IDEA_TABS, type IdeaTab } from "@/shared/domain"
  import { cn } from "$lib/utils"
  import { TAB_LABELS } from "./labels"

  interface Props {
    current: IdeaTab
    href: (tab: IdeaTab) => string
  }

  let { current, href }: Props = $props()
</script>

<!-- D06 to D11: the underline tabs, as links so each part of an idea has its own address. -->
<nav aria-label="Idea sections" class="border-b border-border">
  <ul class="flex h-11 gap-5 overflow-x-auto">
    {#each IDEA_TABS as tab (tab)}
      <li class="flex">
        <a
          href={href(tab)}
          aria-current={tab === current ? "page" : undefined}
          class={cn(
            "relative flex items-center px-related type-label whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/20",
            "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary",
            tab === current
              ? "text-foreground after:opacity-100"
              : "text-muted-foreground after:opacity-0 hover:text-foreground",
          )}>{TAB_LABELS[tab]}</a
        >
      </li>
    {/each}
  </ul>
</nav>
