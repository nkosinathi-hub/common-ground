<script lang="ts">
  import { Textarea } from "$lib/components/ui/textarea"
  import { FormField, SelectField } from "@/shared/ui"
  import { DESCRIPTION_MAX } from "../domain"
  import type { TaskEditorState } from "./task-editor-state.svelte"
  import { memberOptions, milestoneOptions, PRIORITY_OPTIONS, STATUS_OPTIONS } from "./task-options"
  import type { TasksState } from "./tasks-state.svelte"

  let { editor, board }: { editor: TaskEditorState; board: TasksState } = $props()
  const fieldError = (field: string) =>
    editor.error?.field === field ? editor.error.message : undefined
</script>

<!-- S08 fields, in the frame's order and pairs. -->
<FormField id="task-title" label="Title" bind:value={editor.title} error={fieldError("title")} />
<FormField
  id="task-description"
  label="Description (optional)"
  required={false}
  error={fieldError("description")}
>
  {#snippet control({ id })}
    <Textarea {id} bind:value={editor.description} maxlength={DESCRIPTION_MAX} class="min-h-16" />
  {/snippet}
</FormField>
<div class="grid gap-stack sm:grid-cols-2">
  <SelectField
    id="task-status"
    label="Status"
    value={editor.status}
    options={STATUS_OPTIONS}
    onchange={(v) => (editor.status = v)}
  />
  <SelectField
    id="task-priority"
    label="Priority"
    value={editor.priority}
    options={PRIORITY_OPTIONS}
    onchange={(v) => (editor.priority = v)}
  />
  <SelectField
    id="task-assignee"
    label="Assigned to"
    value={editor.assigneeId}
    options={memberOptions(board.members, "Unassigned")}
    onchange={(v) => (editor.assigneeId = v)}
  />
  <FormField
    id="task-due"
    label="Due date"
    type="date"
    required={false}
    bind:value={editor.dueDate}
    error={fieldError("dueDate")}
  />
</div>
<SelectField
  id="task-milestone"
  label="Milestone"
  value={editor.milestoneId}
  options={milestoneOptions(board.milestones, "No milestone")}
  onchange={(v) => (editor.milestoneId = v)}
/>
