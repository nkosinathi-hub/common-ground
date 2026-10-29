<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { ChevronDown } from "@lucide/svelte"
  import { formatDateOnly, todayDateOnly } from "@/shared/domain"
  import { DeleteButton, FormError } from "@/shared/ui"
  import { isOverdue, type Task } from "../domain"
  import Checklist from "./Checklist.svelte"
  import TaskFields from "./TaskFields.svelte"
  import type { TasksState } from "./tasks-state.svelte"

  interface Props {
    task: Task
    board: TasksState
    canDelete: (createdBy: string | null) => boolean
  }

  let { task, board, canDelete }: Props = $props()
  let open = $state(false)
  let error = $state<string | null>(null)
  const overdue = $derived(isOverdue(task, todayDateOnly()))
  async function remove() {
    error = (await board.remove(task.id))?.message ?? null
  }
</script>

<article class="flex flex-col gap-2 rounded-lg border bg-card p-3" data-testid="task-card">
  <div class="flex items-start justify-between gap-2">
    <p class="font-medium">{task.title}</p>
    {#if canDelete(task.createdBy)}
      <DeleteButton
        label="Delete task {task.title}"
        what="this task"
        description="Its checklist is deleted too."
        onConfirm={remove}
      />
    {/if}
  </div>
  <TaskFields {task} {board} onError={(message) => (error = message)} />
  {#if task.dueDate}
    <p class="text-xs {overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}">
      {overdue ? "Overdue: " : "Due "}{formatDateOnly(task.dueDate)}
    </p>
  {/if}
  <FormError message={error} class="text-xs" />
  <Button
    variant="ghost"
    size="sm"
    class="self-start"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <ChevronDown class={open ? "rotate-180" : ""} />Checklist
  </Button>
  {#if open}<Checklist {task} {canDelete} />{/if}
</article>
