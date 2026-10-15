<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { ChevronDown, Trash2 } from "@lucide/svelte"
  import { todayDateOnly } from "@/shared/domain"
  import { formatDue, isOverdue, type Task } from "../domain"
  import Checklist from "./Checklist.svelte"
  import TaskFields from "./TaskFields.svelte"
  import type { TasksState } from "./tasks-state.svelte"

  let { task, board }: { task: Task; board: TasksState } = $props()
  let open = $state(false)
  let error = $state<string | null>(null)
  const overdue = $derived(isOverdue(task, todayDateOnly()))
  const remove = async () => (error = (await board.remove(task.id))?.message ?? null)
</script>

<article class="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="task-card">
  <div class="flex items-start justify-between gap-2">
    <p class="font-medium">{task.title}</p>
    <Button variant="ghost" size="icon-xs" aria-label="Delete task {task.title}" onclick={remove}>
      <Trash2 />
    </Button>
  </div>
  <TaskFields {task} {board} onError={(message) => (error = message)} />
  {#if task.dueDate}
    <p class="text-xs {overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}">
      {overdue ? "Overdue: " : "Due "}{formatDue(task.dueDate)}
    </p>
  {/if}
  {#if error}<p class="text-xs text-destructive" role="alert">{error}</p>{/if}
  <Button
    variant="ghost"
    size="xs"
    class="self-start"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <ChevronDown class={open ? "rotate-180" : ""} />Checklist
  </Button>
  {#if open}<Checklist {task} />{/if}
</article>
