<script lang="ts">
  import { CalendarDays, Check } from "@lucide/svelte"
  import { formatDateOnly, memberName, todayDateOnly, type DateOnly } from "@/shared/domain"
  import { InitialAvatar } from "@/shared/ui"
  import BoardCard from "@/shared/ui/board/BoardCard.svelte"
  import KanbanColumn from "@/shared/ui/board/KanbanColumn.svelte"
  import { groupByStatus, type Task, type TaskStatus } from "../domain"
  import { PRIORITY_LABELS, STATUS_LABELS } from "./labels"
  import TaskMenu from "./TaskMenu.svelte"
  import type { TasksState } from "./tasks-state.svelte"

  interface Props {
    tasks: readonly Task[]
    board: TasksState
    canDelete: (createdBy: string | null) => boolean
    onopen: (task: Task) => void
    onadd: (status: TaskStatus) => void
    onmove: (task: Task, status: TaskStatus) => void
  }

  let { tasks, board, canDelete, onopen, onadd, onmove }: Props = $props()
  const EMPTY: Record<TaskStatus, string> = {
    backlog: "No tasks yet.",
    todo: "Nothing to do yet.",
    in_progress: "Nothing in progress.",
    done: "Finished tasks appear here.",
  }
  const due = (date: DateOnly) => (date === todayDateOnly() ? "Today" : formatDateOnly(date))
  const milestoneOf = (task: Task) => board.milestones.find((m) => m.id === task.milestoneId)
</script>

<!-- D09: the shared Kanban columns; drag a card, use its menu, or + to add one in a column. -->
<div
  class="flex snap-x gap-item overflow-x-auto pb-1 contain-paint"
  role="group"
  aria-label="Tasks board"
>
  {#each groupByStatus(tasks) as column (column.status)}
    <KanbanColumn
      id={column.status}
      title={STATUS_LABELS[column.status]}
      items={column.tasks}
      board="tasks"
      empty={EMPTY[column.status]}
      addLabel="Add a task to {STATUS_LABELS[column.status]}"
      onadd={() => onadd(column.status)}
      onmove={(id, status) => {
        const task = tasks.find((t) => t.id === id)
        if (task) onmove(task, status as TaskStatus)
      }}
    >
      {#snippet card(task)}
        <BoardCard
          title={task.title}
          onopen={() => onopen(task)}
          description={task.description}
          tags={[PRIORITY_LABELS[task.priority], milestoneOf(task)?.title ?? ""].filter(Boolean)}
        >
          {#snippet menu()}
            <TaskMenu
              {task}
              canDelete={canDelete(task.createdBy)}
              onmove={(s) => onmove(task, s)}
              ondelete={async () => void (await board.remove(task.id))}
            />
          {/snippet}
          {#snippet footer()}
            {#if task.assigneeId}<InitialAvatar
                name={memberName(board.members, task.assigneeId)}
                size="sm"
              />{/if}
            {#if task.dueDate}<span
                class="flex items-center gap-hairline type-xs text-muted-foreground"
                ><CalendarDays class="size-4" aria-hidden="true" />{due(task.dueDate)}</span
              >{/if}
            {#if task.checklist?.total}<span
                class="ml-auto flex items-center gap-hairline type-xs text-muted-foreground"
                ><Check class="size-4" aria-hidden="true" />{task.checklist.done}/{task.checklist
                  .total}</span
              >{/if}
          {/snippet}
        </BoardCard>
      {/snippet}
    </KanbanColumn>
  {/each}
</div>
<p class="type-sm text-muted-foreground">
  Drag tasks between columns. Checklists and milestones move with them.
</p>
