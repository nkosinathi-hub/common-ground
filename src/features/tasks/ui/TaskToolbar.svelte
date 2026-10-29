<script lang="ts">
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { ViewToggle } from "@/shared/ui"
  import type { TaskFilter, TaskPriority } from "../domain"
  import { memberOptions, milestoneOptions, PRIORITY_OPTIONS } from "./task-options"
  import type { TasksState } from "./tasks-state.svelte"

  interface Props {
    board: TasksState
    filter: TaskFilter
    summary: string
  }

  let { board, filter = $bindable(), summary }: Props = $props()
  const VIEWS = [
    { value: "list", label: "List" },
    { value: "kanban", label: "Kanban" },
  ] as const
  const quiet = "[&_select]:type-label [&_select]:text-primary"
</script>

<!-- D08/D09 toolbar: the view, then who, how urgent and which milestone; the count on the right. -->
<div class="flex flex-wrap items-center gap-related">
  <ViewToggle value={board.view} options={VIEWS} onchange={(view) => (board.view = view)} />
  <NativeSelect
    aria-label="Assignee"
    class="{quiet} max-md:hidden"
    value={filter.assignee ?? ""}
    onchange={(e) => (filter = { ...filter, assignee: e.currentTarget.value || null })}
  >
    {#each memberOptions(board.members, "Anyone") as o (o.value)}<option value={o.value}
        >{o.label}</option
      >{/each}
  </NativeSelect>
  <NativeSelect
    aria-label="Priority"
    class="{quiet} max-md:hidden"
    value={filter.priority ?? ""}
    onchange={(e) =>
      (filter = { ...filter, priority: (e.currentTarget.value || null) as TaskPriority | null })}
  >
    <option value="">Any priority</option>
    {#each PRIORITY_OPTIONS as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
  </NativeSelect>
  {#if board.view === "list"}
    <NativeSelect
      aria-label="Milestone"
      class="{quiet} max-md:hidden"
      value={filter.milestone ?? ""}
      onchange={(e) => (filter = { ...filter, milestone: e.currentTarget.value || null })}
    >
      {#each milestoneOptions(board.milestones, "Any milestone") as o (o.value)}<option
          value={o.value}>{o.label}</option
        >{/each}
    </NativeSelect>
  {/if}
  <p class="ml-auto type-sm text-muted-foreground">{summary}</p>
</div>
