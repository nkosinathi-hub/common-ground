<script lang="ts">
  import { ArrowRight, SquarePen } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { formatDateOnly } from "@/shared/domain"
  import { TextLink } from "@/shared/ui"
  import type { Milestone, Task } from "../domain"

  interface Props {
    milestone: Milestone
    /** The tasks that move it forward, for the link under it. */
    linked: readonly Task[]
    tasksHref: string
    onToggle: (done: boolean) => void
    onEdit: () => void
  }

  let { milestone, linked, tasksHref, onToggle, onEdit }: Props = $props()
  const done = $derived(milestone.completedAt !== null)
  const linkText = $derived(
    `${linked.length} linked ${linked.length === 1 ? "task" : "tasks"}: ${linked.map((t) => t.title).join(", ")}`,
  )
</script>

<!-- D10 milestone row: tick it done, see its target and the tasks that move it forward. -->
<li class="flex items-start gap-item py-related" data-testid="milestone">
  <Checkbox
    class="mt-hairline"
    aria-label="Done: {milestone.title}"
    checked={done}
    onCheckedChange={(v) => onToggle(v === true)}
  />
  <div class="flex min-w-0 flex-1 flex-col gap-hairline">
    <span class="type-label {done ? 'text-muted-foreground line-through' : 'text-foreground'}"
      >{milestone.title}</span
    >
    {#if milestone.targetDate}
      <span class="type-xs text-muted-foreground"
        >Target {formatDateOnly(milestone.targetDate)}</span
      >
    {/if}
    {#if linked.length > 0}<TextLink href={tasksHref} icon={ArrowRight}>{linkText}</TextLink>{/if}
  </div>
  <Button
    variant="ghost"
    size="icon-sm"
    aria-label="Edit milestone {milestone.title}"
    onclick={onEdit}><SquarePen /></Button
  >
</li>
