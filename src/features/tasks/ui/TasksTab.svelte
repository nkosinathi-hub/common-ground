<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Columns3, List, Plus } from "@lucide/svelte"
  import { ErrorState, Loading } from "@/shared/ui"
  import { groupByStatus } from "../domain"
  import { useTasks } from "./context"
  import { STATUS_LABELS } from "./labels"
  import TaskCard from "./TaskCard.svelte"
  import { TasksState } from "./tasks-state.svelte"

  let { spaceId, ideaId }: { spaceId: string; ideaId: string } = $props()
  const board = new TasksState(useTasks(), () => ({ spaceId, ideaId }))
  $effect(() => void board.load())

  let title = $state("")
  let due = $state("")
  let error = $state<string | null>(null)
  async function add(event: SubmitEvent) {
    event.preventDefault()
    const failure = await board.apply(
      board.uc.create(spaceId, ideaId, { title, dueDate: due || null }),
    )
    error = failure?.message ?? null
    if (failure) return
    title = ""
    due = ""
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex flex-wrap items-end justify-between gap-2">
    <form class="flex flex-wrap items-end gap-2" onsubmit={add} aria-label="Add a task">
      <Input
        class="w-56"
        aria-label="Task title"
        placeholder="New task"
        maxlength={200}
        bind:value={title}
      />
      <label class="flex flex-col text-xs"
        >Due <Input type="date" class="h-8" bind:value={due} /></label
      >
      <Button type="submit" size="sm" disabled={!title.trim()}><Plus />Add task</Button>
    </form>
    <div class="flex gap-1" role="group" aria-label="View">
      <Button
        size="sm"
        variant={board.view === "list" ? "default" : "outline"}
        aria-pressed={board.view === "list"}
        onclick={() => (board.view = "list")}><List />List</Button
      >
      <Button
        size="sm"
        variant={board.view === "kanban" ? "default" : "outline"}
        aria-pressed={board.view === "kanban"}
        onclick={() => (board.view = "kanban")}><Columns3 />Kanban</Button
      >
    </div>
  </div>
  {#if error}<p class="text-sm text-destructive" role="alert">{error}</p>{/if}

  {#if board.error}
    <ErrorState error={board.error} onRetry={() => board.load()} />
  {:else if board.loading && board.items.length === 0}
    <Loading label="Loading tasks" />
  {:else if board.view === "kanban"}
    <div class="flex snap-x gap-3 overflow-x-auto pb-2">
      {#each groupByStatus(board.items) as column (column.status)}
        <section
          class="flex w-72 shrink-0 snap-start flex-col gap-2 rounded-lg bg-muted/40 p-2"
          aria-label={STATUS_LABELS[column.status]}
        >
          <h3 class="text-sm font-semibold">
            {STATUS_LABELS[column.status]} ({column.tasks.length})
          </h3>
          {#each column.tasks as task (task.id)}<TaskCard {task} {board} />{/each}
        </section>
      {/each}
    </div>
  {:else}
    <div class="grid gap-2 md:grid-cols-2">
      {#each board.items as task (task.id)}<TaskCard {task} {board} />
      {:else}<p class="text-sm text-muted-foreground">No tasks yet.</p>{/each}
    </div>
  {/if}
  {#if board.next}<Button variant="outline" size="sm" onclick={() => board.load(true)}
      >Load more</Button
    >{/if}
</div>
