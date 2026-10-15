<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Columns3, Lightbulb, List } from "@lucide/svelte"
  import { EmptyState, ErrorState, Loading, LoadMore } from "@/shared/ui"
  import { allTags } from "../domain"
  import { useIdeas } from "./context"
  import IdeaBoard from "./IdeaBoard.svelte"
  import IdeaCard from "./IdeaCard.svelte"
  import IdeaFilters from "./IdeaFilters.svelte"
  import { IdeasState } from "./ideas-state.svelte"
  import QuickCapture from "./QuickCapture.svelte"

  interface Props {
    spaceId: string
    ideaHref: (ideaId: string) => string
  }

  let { spaceId, ideaHref }: Props = $props()

  const board = new IdeasState(useIdeas(), () => spaceId)
  // Loads on mount, and again if spaceId changes: load reads it before its first await.
  $effect(() => {
    board.load()
  })
</script>

<div class="flex flex-col gap-4">
  <header class="flex flex-wrap items-center justify-between gap-2">
    <h1 class="text-2xl font-semibold">Ideas</h1>
    <div class="flex gap-1" role="group" aria-label="View">
      <Button
        size="sm"
        variant={board.view === "list" ? "default" : "outline"}
        aria-pressed={board.view === "list"}
        onclick={() => (board.view = "list")}><List />List</Button
      >
      <Button
        size="sm"
        variant={board.view === "board" ? "default" : "outline"}
        aria-pressed={board.view === "board"}
        onclick={() => (board.view = "board")}><Columns3 />Board</Button
      >
    </div>
  </header>

  <QuickCapture onCapture={(title, template) => board.capture({ title, template })} />
  <IdeaFilters bind:filter={board.filter} tags={allTags(board.list.items)} />

  {#if board.moveError}
    <p class="text-sm text-destructive" role="alert">{board.moveError.message}</p>
  {/if}
  {#if board.list.error && board.list.items.length === 0}
    <ErrorState error={board.list.error} onRetry={() => board.load()} />
  {:else if board.list.loading && board.list.items.length === 0}
    <Loading label="Loading ideas" />
  {:else if board.list.items.length === 0}
    <EmptyState
      icon={Lightbulb}
      title="No ideas yet"
      description="A business, a creative project, a wild little thought. There is room for it here."
    />
  {:else if board.view === "board"}
    <IdeaBoard ideas={board.visible} {ideaHref} onMove={(id, stage) => board.move(id, stage)} />
  {:else}
    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {#each board.visible as idea (idea.id)}
        <IdeaCard {idea} href={ideaHref(idea.id)} onMove={(stage) => board.move(idea.id, stage)} />
      {:else}
        <p class="text-sm text-muted-foreground">No ideas match these filters.</p>
      {/each}
    </div>
  {/if}

  <LoadMore list={board.list} />
</div>
