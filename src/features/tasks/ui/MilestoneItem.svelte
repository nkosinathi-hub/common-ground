<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Pencil } from "@lucide/svelte"
  import { DeleteButton } from "@/shared/ui"
  import { formatDue, type Milestone, type MilestoneInput } from "../domain"
  import MilestoneEdit from "./MilestoneEdit.svelte"

  interface Props {
    milestone: Milestone
    deletable: boolean
    onToggle: (done: boolean) => void
    onEdit: (input: MilestoneInput) => Promise<boolean>
    onRemove: () => void
  }

  let { milestone, deletable, onToggle, onEdit, onRemove }: Props = $props()
  let editing = $state(false)
</script>

<li class="flex items-center justify-between gap-2 rounded-lg border p-3" data-testid="milestone">
  {#if editing}
    <MilestoneEdit {milestone} onSave={onEdit} onCancel={() => (editing = false)} />
  {:else}
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        checked={milestone.completedAt !== null}
        onchange={(e) => onToggle(e.currentTarget.checked)}
      />
      <span class={milestone.completedAt ? "text-muted-foreground line-through" : "font-medium"}
        >{milestone.title}</span
      >
    </label>
    <span class="flex items-center gap-2 text-xs">
      {#if milestone.targetDate}<span class="text-muted-foreground"
          >Target {formatDue(milestone.targetDate)}</span
        >{/if}
      <Button
        size="icon"
        variant="ghost"
        aria-label="Edit milestone {milestone.title}"
        onclick={() => (editing = true)}><Pencil /></Button
      >
      {#if deletable}
        <DeleteButton
          label="Delete milestone {milestone.title}"
          what="this milestone"
          description="Tasks linked to it stay, without a milestone."
          onConfirm={onRemove}
        />
      {/if}
    </span>
  {/if}
</li>
