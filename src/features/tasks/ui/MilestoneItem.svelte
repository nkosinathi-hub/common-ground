<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Trash2 } from "@lucide/svelte"
  import { formatDue, type Milestone } from "../domain"

  let {
    milestone: m,
    onToggle,
    onRemove,
  }: { milestone: Milestone; onToggle: (done: boolean) => void; onRemove: () => void } = $props()
</script>

<li class="flex items-center justify-between gap-2 rounded-lg border p-3" data-testid="milestone">
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
      variant="ghost"
      size="icon-xs"
      aria-label="Delete milestone {m.title}"
      onclick={onRemove}
    >
      <Trash2 />
    </Button>
  </span>
</li>
