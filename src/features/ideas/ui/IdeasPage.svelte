<script lang="ts">
  import { untrack } from "svelte"
  import { MediaQuery } from "svelte/reactivity"
  import { Lightbulb, Plus } from "@lucide/svelte"
  import { ok, type MemberRef } from "@/shared/domain"
  import { EmptyState, ErrorState, Fab, FormError, Loading, LoadMore } from "@/shared/ui"
  import { allTags } from "../domain"
  import { useIdeas } from "./context"
  import IdeaBoard from "./IdeaBoard.svelte"
  import IdeaList from "./IdeaList.svelte"
  import IdeaFilters from "./IdeaFilters.svelte"
  import { IdeasState } from "./ideas-state.svelte"
  import { openCapture } from "./capture-request.svelte"
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
  const wide = new MediaQuery("min-width: 768px")

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
    <IdeaList
      ideas={board.visible}
      {ideaHref}
      {authors}
      onMove={(id, stage) => board.move(id, stage)}
    />
  {/if}

  <LoadMore list={board.list} />
</div>
{#if !wide.current}<Fab
    icon={Plus}
    label="Capture idea"
    onclick={openCapture}
    class="fixed right-gutter bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30"
  />{/if}
