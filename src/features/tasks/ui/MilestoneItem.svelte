<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Pencil } from "@lucide/svelte"
  import { DeleteButton } from "@/shared/ui"
  import { formatDue, type Milestone, type MilestoneInput } from "../domain"
  import MilestoneEdit from "./MilestoneEdit.svelte"

  interface Props {
    milestone: Milestone
    onToggle: (done: boolean) => void
    onEdit: (input: MilestoneInput) => Promise<boolean>
    onRemove: () => void
  }

  let { milestone: m, onToggle, onEdit, onRemove }: Props = $props()
  let editing = $state(false)
</script>

<li class="flex items-center justify-between gap-2 rounded-lg border p-3" data-testid="milestone">
  {#if editing}
    <MilestoneEdit milestone={m} onSave={onEdit} onCancel={() => (editing = false)} />
  {:else}
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        checked={m.completedAt !== null}
        onchange={(e) => onToggle(e.currentTarget.checked)}
      />
      <span class={m.completedAt ? "text-muted-foreground line-through" : "font-medium"}
        >{m.title}</span
      >
    </label>
    <span class="flex items-center gap-2 text-xs">
      {#if m.targetDate}<span class="text-muted-foreground">Target {formatDue(m.targetDate)}</span
        >{/if}
      <Button
        size="icon"
        variant="ghost"
        aria-label="Edit milestone {m.title}"
        onclick={() => (editing = true)}><Pencil /></Button
      >
      <DeleteButton
        label="Delete milestone {m.title}"
        what="this milestone"
        description="Tasks linked to it stay, without a milestone."
        onConfirm={onRemove}
      />
    </span>
  {/if}
</li>
