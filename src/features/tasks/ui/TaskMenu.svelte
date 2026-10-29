<script lang="ts">
  import { Trash2 } from "@lucide/svelte"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { ConfirmDialog } from "@/shared/ui"
  import MoveMenu from "@/shared/ui/board/MoveMenu.svelte"
  import { TASK_STATUSES, type Task, type TaskStatus } from "../domain"
  import { STATUS_LABELS } from "./labels"

  interface Props {
    task: Task
    canDelete: boolean
    onmove: (status: TaskStatus) => void
    ondelete: () => Promise<void>
  }

  let { task, canDelete, onmove, ondelete }: Props = $props()
  let confirming = $state(false)
  const columns = TASK_STATUSES.map((id) => ({ id, title: STATUS_LABELS[id] }))
</script>

<!-- Moving by keyboard (beside dragging on the Kanban), and deleting, in the task's menu. -->
<MoveMenu
  subject={task.title}
  {columns}
  current={task.status}
  heading="Move to status"
  onmove={(status) => onmove(status as TaskStatus)}
>
  {#if canDelete}
    <DropdownMenu.Item variant="destructive" onSelect={() => (confirming = true)}>
      <Trash2 aria-hidden="true" />Delete task
    </DropdownMenu.Item>
  {/if}
</MoveMenu>
<ConfirmDialog
  bind:open={confirming}
  title="Delete {task.title}?"
  description="Its checklist is deleted too."
  confirmLabel="Delete"
  onConfirm={ondelete}
/>
