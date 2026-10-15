<script lang="ts">
  import type { Result } from "@/shared/domain"
  import {
    TASK_PRIORITIES,
    TASK_STATUSES,
    type Task,
    type TaskPriority,
    type TaskStatus,
  } from "../domain"
  import { PRIORITY_LABELS, SELECT, STATUS_LABELS } from "./labels"
  import type { TasksState } from "./tasks-state.svelte"

  interface Props {
    task: Task
    board: TasksState
    onError: (message: string | null) => void
  }

  let { task, board, onError }: Props = $props()
  const tasks = $derived(board.services.tasks)
  const run = async (write: Promise<Result<Task>>) =>
    onError((await board.update(write))?.message ?? null)
  const value = (event: Event) =>
    (event.currentTarget as HTMLSelectElement | HTMLInputElement).value
</script>

<div class="grid grid-cols-2 gap-2 text-xs">
  <label class="flex flex-col gap-1">
    Status
    <select
      class={SELECT}
      value={task.status}
      onchange={(event) => run(tasks.move(task.id, value(event) as TaskStatus))}
    >
      {#each TASK_STATUSES as status (status)}<option value={status}>{STATUS_LABELS[status]}</option
        >{/each}
    </select>
  </label>
  <label class="flex flex-col gap-1">
    Priority
    <select
      class={SELECT}
      value={task.priority}
      onchange={(event) => run(tasks.prioritize(task.id, value(event) as TaskPriority))}
    >
      {#each TASK_PRIORITIES as priority (priority)}<option value={priority}
          >{PRIORITY_LABELS[priority]}</option
        >{/each}
    </select>
  </label>
  <label class="flex flex-col gap-1">
    Assignee
    <select
      class={SELECT}
      value={task.assigneeId ?? ""}
      onchange={(event) => run(tasks.assign(task.id, value(event) || null))}
    >
      <option value="">Unassigned</option>
      {#each board.members as member (member.id)}<option value={member.id}
          >{member.displayName}</option
        >{/each}
    </select>
  </label>
  <label class="flex flex-col gap-1">
    Due
    <input
      type="date"
      class={SELECT}
      value={task.dueDate ?? ""}
      onchange={(event) => run(tasks.setDue(task.id, value(event) || null))}
    />
  </label>
  <label class="col-span-2 flex flex-col gap-1">
    Milestone
    <select
      class={SELECT}
      value={task.milestoneId ?? ""}
      onchange={(event) => run(tasks.linkMilestone(task.id, value(event) || null))}
    >
      <option value="">None</option>
      {#each board.milestones as milestone (milestone.id)}<option value={milestone.id}
          >{milestone.title}</option
        >{/each}
    </select>
  </label>
</div>
