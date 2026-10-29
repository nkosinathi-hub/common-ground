<script lang="ts">
  import { untrack } from "svelte"
  import { Lightbulb } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { ok, type MemberRef } from "@/shared/domain"
  import { EmptyState, ErrorState, FormError, Loading, LoadMore } from "@/shared/ui"
  import { allTags } from "../domain"
  import { useIdeas } from "./context"
  import IdeaBoard from "./IdeaBoard.svelte"
  import IdeaListCard from "./IdeaListCard.svelte"
  import IdeaFilters from "./IdeaFilters.svelte"
  import { IdeasState } from "./ideas-state.svelte"
  import { onCaptured } from "./captured"

  interface Props {
    spaceId: string
    /** The signed-in user, for the Mine and Ours filters. */
    me: string
    ideaHref: (ideaId: string) => string
    /** Names for who started and shares each idea. */
    authors?: readonly MemberRef[]
  }

  let { spaceId, me, ideaHref, authors = [] }: Props = $props()

  const board = new IdeasState(
    useIdeas().service,
    () => spaceId,
    () => me,
  )
  // Loads on mount and again when spaceId changes.
  $effect(() => {
    void spaceId
    untrack(() => void board.load())
  })
  // An idea saved from the capture dialog joins the list at once.
  $effect(() => onCaptured((idea) => void board.list.add(Promise.resolve(ok(idea)))))
</script>

<div class="flex flex-col gap-section">
  <header class="flex flex-col gap-related">
    <h1 class="type-h1">
      {board.view === "board" ? "Ideas, finding their shape." : "Room for what could be."}
    </h1>
    <p class="type-body text-muted-foreground">
      {board.view === "board"
        ? "The same ideas, arranged by where they are now."
        : "Small sparks, shared plans, and things you are making together."}
    </p>
  </header>

  <IdeaFilters
    bind:filter={board.filter}
    tags={allTags(board.list.items)}
    view={board.view}
    onview={(view) => (board.view = view)}
  />

  <FormError message={board.moveError?.message} />
  {#if board.list.error && board.list.items.length === 0}
    <ErrorState error={board.list.error} onRetry={() => board.load()} />
  {:else if board.list.loading && board.list.items.length === 0}
    <Loading label="Loading ideas" />
  {:else if board.list.items.length === 0 && !board.filter.whose}
    <EmptyState
      icon={Lightbulb}
      title="No ideas yet"
      description="A business, a creative project, a wild little thought. There is room for it here."
    />
  {:else if board.view === "board"}
    <IdeaBoard
      ideas={board.visible}
      {ideaHref}
      {authors}
      onMove={(id, stage) => board.move(id, stage)}
    />
  {:else}
    <div class="flex flex-col gap-stack">
      {#each board.visible as idea (idea.id)}
        <IdeaListCard
          {idea}
          href={ideaHref(idea.id)}
          {authors}
          onMove={(stage) => board.move(idea.id, stage)}
        />
      {:else}
        <p class="type-sm text-muted-foreground">No ideas match these filters.</p>
      {/each}
    </div>
    <Alert.Root variant="secondary">
      <Alert.Description>
        Every idea has room to evolve. Change its stage without losing research, tasks or
        discussion.
      </Alert.Description>
    </Alert.Root>
  {/if}

  <LoadMore list={board.list} />
</div>
