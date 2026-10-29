<script lang="ts">
  import { CalendarDays } from "@lucide/svelte"
  import type { Task } from "../domain"
  import TaskListCard from "./TaskListCard.svelte"
  import type { TasksState } from "./tasks-state.svelte"

  interface Props {
    tasks: readonly Task[]
    board: TasksState
    canDelete: (createdBy: string | null) => boolean
    ideaTitle: string
    compact: boolean
    onedit: (task: Task) => void
  }

  let { tasks, board, canDelete, ideaTitle, compact, onedit }: Props = $props()
</script>

<div class="flex flex-col gap-stack">
  {#each tasks as task (task.id)}
    <TaskListCard {task} {board} {canDelete} {compact} onedit={() => onedit(task)} />
  {:else}<p class="type-sm text-muted-foreground">No tasks yet.</p>{/each}
</div>
<p class="flex items-center gap-item rounded-lg bg-secondary p-inset type-sm text-primary">
  <CalendarDays class="size-4 shrink-0" aria-hidden="true" />
  Task due dates stay linked to {ideaTitle}, so you can find the plan from Home or Calendar.
</p>
