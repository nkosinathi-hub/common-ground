<script lang="ts">
  import {
    TASK_PRIORITIES,
    TASK_STATUSES,
    type Task,
    type TaskPriority,
    type TaskStatus,
  } from "../domain"
  import { PRIORITY_LABELS, SELECT, STATUS_LABELS } from "./labels"
  import type { TasksState } from "./tasks-state.svelte"

  let {
    task,
    board,
    onError,
  }: { task: Task; board: TasksState; onError: (message: string | null) => void } = $props()

  const uc = $derived(board.uc)
  const run = async (write: ReturnType<typeof uc.move>) =>
    onError((await board.apply(write))?.message ?? null)
  const value = (e: Event) => (e.currentTarget as HTMLSelectElement | HTMLInputElement).value
</script>

<div class="grid grid-cols-2 gap-2 text-xs">
  <label class="flex flex-col gap-1">
    Status
    <select
      class={SELECT}
      value={task.status}
      onchange={(e) => run(uc.move(task.id, value(e) as TaskStatus))}
    >
      {#each TASK_STATUSES as s (s)}<option value={s}>{STATUS_LABELS[s]}</option>{/each}
    </select>
  </label>
  <label class="flex flex-col gap-1">
    Priority
    <select
      class={SELECT}
      value={task.priority}
      onchange={(e) => run(uc.prioritize(task.id, value(e) as TaskPriority))}
    >
      {#each TASK_PRIORITIES as p (p)}<option value={p}>{PRIORITY_LABELS[p]}</option>{/each}
    </select>
  </label>
  <label class="flex flex-col gap-1">
    Assignee
    <select
      class={SELECT}
      value={task.assigneeId ?? ""}
      onchange={(e) => run(uc.assign(task.id, value(e) || null))}
    >
      <option value="">Unassigned</option>
      {#each board.members as m (m.id)}<option value={m.id}>{m.displayName}</option>{/each}
    </select>
  </label>
  <label class="flex flex-col gap-1">
    Due
    <input
      type="date"
      class={SELECT}
      value={task.dueDate ?? ""}
      onchange={(e) => run(uc.setDue(task.id, value(e) || null))}
    />
  </label>
  <label class="col-span-2 flex flex-col gap-1">
    Milestone
    <select
      class={SELECT}
      value={task.milestoneId ?? ""}
      onchange={(e) => run(uc.linkMilestone(task.id, value(e) || null))}
    >
      <option value="">None</option>
      {#each board.milestones as m (m.id)}<option value={m.id}>{m.title}</option>{/each}
    </select>
  </label>
</div>
