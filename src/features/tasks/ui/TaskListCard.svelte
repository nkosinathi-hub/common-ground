<script lang="ts">
  import { CalendarDays, Flag, SquarePen, UserRound } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { formatDateOnly, memberName } from "@/shared/domain"
  import { FormError, ListRow } from "@/shared/ui"
  import type { Task, TaskStatus } from "../domain"
  import Checklist from "./Checklist.svelte"
  import TaskChips from "./TaskChips.svelte"
  import TaskMenu from "./TaskMenu.svelte"
  import type { TasksState } from "./tasks-state.svelte"

  interface Props {
    task: Task
    board: TasksState
    canDelete: (createdBy: string | null) => boolean
    /** Phones: who, when and milestone as rows that open the editor (M04). */
    compact: boolean
    onedit: () => void
  }

  let { task, board, canDelete, compact, onedit }: Props = $props()
  let error = $state<string | null>(null)
  const tasks = $derived(board.services.tasks)
  const milestone = $derived(board.milestones.find((m) => m.id === task.milestoneId))
  const run = async (write: ReturnType<typeof tasks.move>) =>
    (error = (await board.update(write))?.message ?? null)
  const move = (status: TaskStatus) => run(tasks.move(task.id, status))
  async function remove() {
    error = (await board.remove(task.id))?.message ?? null
  }
</script>

<!-- D08 task card (M04 on phones): tick it done, read it at a glance, edit it in one place. -->
<article
  class="flex flex-col gap-item rounded-lg border border-border bg-card p-card"
  data-testid="task-card"
>
  <div class="flex items-start gap-item">
    <Checkbox
      class="mt-hairline"
      aria-label="Done: {task.title}"
      checked={task.status === "done"}
      onCheckedChange={(done) => move(done === true ? "done" : "todo")}
    />
    <div class="flex min-w-0 flex-1 flex-col gap-hairline">
      <h3 class="type-h3 text-foreground {task.status === 'done' ? 'line-through' : ''}">
        {task.title}
      </h3>
      {#if task.description}<p class="type-sm text-muted-foreground">{task.description}</p>{/if}
    </div>
    {#if !compact}
      <Button variant="ghost" size="icon-sm" aria-label="Edit {task.title}" onclick={onedit}
        ><SquarePen /></Button
      >
    {/if}
    <TaskMenu {task} canDelete={canDelete(task.createdBy)} onmove={move} ondelete={remove} />
  </div>
  <TaskChips {task} members={board.members} milestones={board.milestones} {compact} />
  {#if compact}
    <ul class="flex flex-col divide-y divide-border border-y border-border">
      {#each [{ icon: UserRound, label: "Assigned to", value: task.assigneeId ? memberName(board.members, task.assigneeId) : "Nobody" }, { icon: CalendarDays, label: "Due", value: task.dueDate ? formatDateOnly(task.dueDate) : "No date" }, { icon: Flag, label: "Milestone", value: milestone?.title ?? "None" }] as row (row.label)}
        <li>
          <ListRow icon={row.icon} title={row.label} onclick={onedit} class="min-h-12">
            {#snippet trailing()}<span class="type-label text-foreground">{row.value}</span
              >{/snippet}
          </ListRow>
        </li>
      {/each}
    </ul>
  {/if}
  <Checklist {task} {canDelete} />
  <FormError message={error} />
</article>
