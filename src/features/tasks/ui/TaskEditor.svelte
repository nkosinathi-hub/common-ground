<script lang="ts">
  import { untrack } from "svelte"
  import { CollapsibleGroup, DialogShell, FormError } from "@/shared/ui"
  import type { Task, TaskStatus } from "../domain"
  import Checklist from "./Checklist.svelte"
  import TaskEditorFields from "./TaskEditorFields.svelte"
  import { TaskEditorState } from "./task-editor-state.svelte"
  import type { TasksState } from "./tasks-state.svelte"

  interface Props {
    open: boolean
    /** The task to edit; null adds a new one in `status`. */
    task: Task | null
    status?: TaskStatus
    board: TasksState
    ideaTitle: string
    canDelete: (createdBy: string | null) => boolean
  }

  let { open = $bindable(false), task, status, board, ideaTitle, canDelete }: Props = $props()
  const editor = untrack(() => new TaskEditorState(board))
  $effect(() => {
    if (open) untrack(() => editor.fill(task, status))
  })
  async function save() {
    if (await editor.save(task)) open = false
  }
</script>

<!-- S08 task editor: every field of a task, saved together; on phones a bottom sheet. -->
<DialogShell
  bind:open
  title={task ? "Edit task" : "New task"}
  description="Part of {ideaTitle}."
  primary="Save task"
  busy={editor.busy}
  onsubmit={save}
>
  <div class="flex flex-col gap-stack">
    <TaskEditorFields {editor} {board} />
    {#if task}
      <CollapsibleGroup
        title="Checklist"
        meta={task.checklist ? `${task.checklist.done} of ${task.checklist.total} done` : undefined}
      >
        <div class="pt-inset"><Checklist {task} {canDelete} /></div>
      </CollapsibleGroup>
    {/if}
    {#if editor.error && !editor.error.field}<FormError message={editor.error.message} />{/if}
  </div>
</DialogShell>
