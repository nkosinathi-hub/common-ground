<script lang="ts">
  import { CalendarDays, Check } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { formatDateOnly, memberName, todayDateOnly, type MemberRef } from "@/shared/domain"
  import { InitialAvatar } from "@/shared/ui"
  import { isOverdue, type Milestone, type Task } from "../domain"
  import { PRIORITY_LABELS, STATUS_LABELS } from "./labels"

  interface Props {
    task: Task
    members: readonly MemberRef[]
    milestones: readonly Milestone[]
    /** Phones show status and priority here; who, when and milestone move to rows (M04). */
    compact?: boolean
  }

  let { task, members, milestones, compact = false }: Props = $props()
  const overdue = $derived(isOverdue(task, todayDateOnly()))
  const milestone = $derived(milestones.find((m) => m.id === task.milestoneId))
</script>

<!-- D08 task chips: status, priority, who, when and the milestone it moves towards. -->
<div class="flex flex-wrap items-center gap-x-item gap-y-related">
  <Badge variant="secondary">{STATUS_LABELS[task.status]}</Badge>
  <Badge variant="outline">{PRIORITY_LABELS[task.priority]} priority</Badge>
  {#if !compact}
    {#if task.assigneeId}
      <span class="flex items-center gap-hairline type-xs text-muted-foreground">
        <InitialAvatar name={memberName(members, task.assigneeId)} size="sm" decorative />
        {memberName(members, task.assigneeId)}
      </span>
    {/if}
    {#if task.dueDate}
      <span
        class="flex items-center gap-hairline type-xs {overdue
          ? 'text-destructive'
          : 'text-muted-foreground'}"
      >
        <CalendarDays class="size-4" aria-hidden="true" />{overdue ? "Overdue" : "Due"}
        {formatDateOnly(task.dueDate)}
      </span>
    {/if}
    {#if milestone}
      <span class="flex items-center gap-hairline type-xs text-muted-foreground">
        <Check class="size-4" aria-hidden="true" />{milestone.title}
      </span>
    {/if}
  {/if}
</div>
