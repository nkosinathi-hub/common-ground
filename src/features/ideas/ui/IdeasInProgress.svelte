<script lang="ts">
  import { untrack } from "svelte"
  import { Lightbulb } from "@lucide/svelte"
  import { AsyncView, EmptyState, Resource } from "@/shared/ui"
  import type { Idea } from "../domain"
  import { useIdeas } from "./context"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    spaceId: string
    ideaHref: (ideaId: string) => string
  }

  let { spaceId, ideaHref }: Props = $props()
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
      <ul class="flex flex-col gap-1" data-testid="ideas-in-progress">
        {#each list as idea (idea.id)}
          <li>
            <a
              href={ideaHref(idea.id)}
              class="flex items-baseline justify-between gap-2 rounded-md p-2 hover:bg-muted"
            >
              <span class="min-w-0 truncate font-medium">{idea.title}</span>
              <span class="shrink-0 text-xs text-muted-foreground">{STAGE_LABELS[idea.stage]}</span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/snippet}
</AsyncView>
