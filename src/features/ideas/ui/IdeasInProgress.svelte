<script lang="ts">
  import { ChevronRight } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { untrack } from "svelte"
  import { Lightbulb } from "@lucide/svelte"
  import { AsyncView, EmptyState, Resource } from "@/shared/ui"
  import type { Idea } from "../domain"
  import { useIdeas } from "./context"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    spaceId: string
    ideaHref: (ideaId: string) => string
    /** Phones show only the first in their Up next card. */
    limit?: number
  }

  let { spaceId, ideaHref, limit }: Props = $props()
  const service = useIdeas().service
  const ideas = new Resource<Idea[]>(() => service.inProgress(untrack(() => spaceId)))
  $effect(() => {
    void spaceId
    untrack(() => void ideas.load())
  })
</script>

<!-- The Home card ("Ideas in progress") titles this list, so it has no heading of its own. -->
<AsyncView resource={ideas}>
  {#snippet children(list)}
    {#if list.length === 0}
      <EmptyState
        icon={Lightbulb}
        title="Nothing in progress"
        description="Ideas you are exploring, planning or building show up here."
      />
    {:else}
      <ul class="-mx-related flex flex-col" data-testid="ideas-in-progress">
        {#each list.slice(0, limit) as idea (idea.id)}
          <li>
            <a
              href={ideaHref(idea.id)}
              class="flex min-h-11 items-center gap-item rounded-md px-related outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <span class="min-w-0 flex-1 truncate type-label text-foreground">{idea.title}</span>
              <Badge variant={idea.stage === "planning" ? "default" : "secondary"}>
                {STAGE_LABELS[idea.stage]}
              </Badge>
              <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/snippet}
</AsyncView>
