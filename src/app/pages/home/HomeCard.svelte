<script lang="ts">
  import { PenLine } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { useAuth } from "@/features/auth"
  import { UpcomingEvents } from "@/features/calendar"
  import { IdeasInProgress } from "@/features/ideas"
  import { NotesCard, OnYourMindCard } from "@/features/notes"
  import { ActivityFeed } from "@/features/notifications"
  import { RecommendationsInbox } from "@/features/recommendations"
  import type { Space } from "@/features/spaces"
  import { UpcomingTasks } from "@/features/tasks"
  import { ContinueWatching } from "@/features/watch"
  import { buildHash, HOME_CARD_LABELS, type HomeCardId } from "@/shared/domain"
  import { TextLink } from "@/shared/ui"

  interface Props {
    id: HomeCardId
    space: Space
    /** Grid placement from HomePage, for example a full-width notes card. */
    class?: string
  }

  let { id, space, class: className }: Props = $props()
  let writing = $state(false)
  const { session } = useAuth()
  const spaceId = $derived(space.id)
  const title = $derived(id === "activity" ? `Recently in ${space.name}` : HOME_CARD_LABELS[id])
  const itemHref = (itemId: string) => buildHash({ name: "watch-item", spaceId, itemId })
  const taskHref = (ideaId: string) => buildHash({ name: "idea", spaceId, ideaId, tab: "tasks" })
  const ideaHref = (ideaId: string) => buildHash({ name: "idea", spaceId, ideaId, tab: "overview" })
</script>

{#if id === "on_your_mind"}
  <!-- A single row that opens the composer: the card needs no title of its own. -->
  <Card.Root class="py-related {className ?? ''}">
    <Card.Content class="px-related"><OnYourMindCard {spaceId} /></Card.Content>
  </Card.Root>
{:else}
  <Card.Root class={className}>
    <Card.Header>
      <Card.Title>{title}</Card.Title>
      {#if id === "notes"}
        <!-- The section's one action, on the title's line. -->
        <Card.Action class="flex items-center gap-item self-center">
          <Button size="sm" variant="outline" onclick={() => (writing = true)}>
            <PenLine aria-hidden="true" />Write a note
          </Button>
          <TextLink href={buildHash({ name: "notes", spaceId })}>See all</TextLink>
        </Card.Action>
      {:else if id === "ideas"}
        <Card.Action class="self-center">
          <TextLink href={buildHash({ name: "ideas", spaceId })}>See all</TextLink>
        </Card.Action>
      {/if}
    </Card.Header>
    <Card.Content>
      {#if id === "notes"}
        <NotesCard {spaceId} bind:writing limit={2} />
      {:else if id === "continue_watching"}
        <ContinueWatching
          {spaceId}
          listHref={buildHash({ name: "watch", spaceId })}
          {itemHref}
          me={session.user?.id}
        />
      {:else if id === "coming_up"}
        <UpcomingTasks {spaceId} {taskHref} />
      {:else if id === "calendar"}
        <UpcomingEvents {spaceId} />
      {:else if id === "recommended"}
        <RecommendationsInbox
          {spaceId}
          {itemHref}
          libraryHref={buildHash({ name: "watch", spaceId })}
        />
      {:else if id === "ideas"}
        <IdeasInProgress {spaceId} {ideaHref} />
      {:else if id === "activity"}
        <ActivityFeed {spaceId} limit />
      {/if}
    </Card.Content>
  </Card.Root>
{/if}
