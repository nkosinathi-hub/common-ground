<script lang="ts">
  import { untrack } from "svelte"
  import { MediaQuery } from "svelte/reactivity"
  import { Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { ErrorState, Fab, Loading, LoadMore } from "@/shared/ui"
  import { filterTasks, tasksSummary, type Task, type TaskFilter, type TaskStatus } from "../domain"
  import { useTasks } from "./context"
  import NewTaskRow from "./NewTaskRow.svelte"
  import TaskBoard from "./TaskBoard.svelte"
  import TaskEditor from "./TaskEditor.svelte"
  import TaskList from "./TaskList.svelte"
  import TaskToolbar from "./TaskToolbar.svelte"
  import { TasksState } from "./tasks-state.svelte"

  interface Props {
    spaceId: string
    ideaId: string
    /** For the editor's "Part of …" line and the dates callout. */
    ideaTitle: string
    /** Whether the viewer may delete a row by this author (the author or the space owner). */
    canDelete: (createdBy: string | null) => boolean
  }

  let { spaceId, ideaId, ideaTitle, canDelete }: Props = $props()
  const board = new TasksState(useTasks(), () => ({ spaceId, ideaId }))
  const list = board.list
  const wide = new MediaQuery("min-width: 768px")
  let filter = $state<TaskFilter>({})
  let editing = $state<{ task: Task | null; status?: TaskStatus } | null>(null)
  let editorOpen = $state(false)
  const shown = $derived(filterTasks(list.items, filter))
  const edit = (task: Task | null, status?: TaskStatus) => (
    (editing = { task, status }),
    (editorOpen = true)
  )
  const move = (task: Task, status: TaskStatus) =>
    board.update(board.services.tasks.move(task.id, status))

  // Loads on mount and again when the idea changes.
  $effect(() => {
    void [spaceId, ideaId]
    untrack(() => void board.load())
  })
</script>

<!-- D08 list and D09 Kanban (M04 on phones): add, filter, then the tasks themselves. -->
<div class="flex flex-col gap-section">
  {#if board.view === "list" && wide.current}<NewTaskRow {board} />{/if}
  <div class="flex items-center gap-related">
    <div class="min-w-0 flex-1">
      <TaskToolbar {board} bind:filter summary={tasksSummary(shown)} />
    </div>
    {#if board.view === "kanban"}<Button
        size="icon"
        aria-label="New task"
        onclick={() => edit(null, "todo")}><Plus /></Button
      >{/if}
  </div>
  {#if list.error && list.items.length === 0}
    <ErrorState error={list.error} onRetry={() => board.load()} />
  {:else if list.loading && list.items.length === 0}
    <Loading label="Loading tasks" />
  {:else if board.view === "kanban"}
    <TaskBoard
      tasks={shown}
      {board}
      {canDelete}
      onopen={(t) => edit(t)}
      onadd={(s) => edit(null, s)}
      onmove={move}
    />
  {:else}
    <TaskList
      tasks={shown}
      {board}
      {canDelete}
      {ideaTitle}
      compact={!wide.current}
      onedit={(t) => edit(t)}
    />
  {/if}
  <LoadMore {list} />
</div>
{#if !wide.current}<Fab
    icon={Plus}
    label="New task"
    onclick={() => edit(null, "todo")}
    class="fixed right-gutter bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30"
  />{/if}
{#if editing}
  <TaskEditor
    bind:open={editorOpen}
    task={editing.task}
    status={editing.status}
    {board}
    {ideaTitle}
    {canDelete}
  />
{/if}
