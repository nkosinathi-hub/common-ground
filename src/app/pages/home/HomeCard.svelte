<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import { ActivityFeed } from "@/features/notifications"
  import { RecommendationsInbox } from "@/features/recommendations"
  import type { Space } from "@/features/spaces"
  import { UpcomingTasks } from "@/features/tasks"
  import { ContinueWatching } from "@/features/watch"
  import { buildHash, HOME_CARD_LABELS, type HomeCardId } from "@/shared/domain"

  let { id, space }: { id: HomeCardId; space: Space } = $props()
  const spaceId = $derived(space.id)
  const title = $derived(id === "activity" ? `Recently in ${space.name}` : HOME_CARD_LABELS[id])
  const itemHref = (itemId: string) => buildHash({ name: "watch-item", spaceId, itemId })
  const taskHref = (ideaId: string) => buildHash({ name: "idea", spaceId, ideaId, tab: "tasks" })
</script>

<Card.Root>
  <Card.Header><Card.Title>{title}</Card.Title></Card.Header>
  <Card.Content>
    {#if id === "continue_watching"}
      <ContinueWatching {spaceId} listHref={buildHash({ name: "watch", spaceId })} {itemHref} />
    {:else if id === "coming_up"}
      <UpcomingTasks {spaceId} {taskHref} />
    {:else if id === "recommended"}
      <RecommendationsInbox {spaceId} {itemHref} />
    {:else if id === "activity"}
      <ActivityFeed {spaceId} limit />
    {/if}
  </Card.Content>
</Card.Root>
