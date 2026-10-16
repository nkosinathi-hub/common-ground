<script lang="ts">
  import { untrack } from "svelte"
  import { CalendarCheck } from "@lucide/svelte"
  import { formatDateOnly, todayDateOnly } from "@/shared/domain"
  import { AsyncView, EmptyState, Resource } from "@/shared/ui"
  import { dueState, type UpcomingTask } from "../domain"
  import { useTasks } from "./context"

  const LABEL = { overdue: "Overdue", today: "Due today", soon: "Due" } as const

  interface Props {
    spaceId: string
    taskHref: (ideaId: string) => string
  }

  let { spaceId, taskHref }: Props = $props()
  const service = useTasks().tasks
  const tasks = new Resource<UpcomingTask[]>(() => service.upcoming(untrack(() => spaceId)))
  // Reloads when Home switches to another space.
  $effect(() => {
    void spaceId
    void tasks.load()
  })

  const today = todayDateOnly()
</script>

<!-- The Home card ("Coming up") titles this list, so it has no heading of its own. -->
<div class="flex flex-col gap-2">
  <AsyncView resource={tasks}>
    {#snippet children(items)}
      {#if items.length === 0}
        <EmptyState
          icon={CalendarCheck}
          title="Nothing due"
          description="Tasks with a due date show up here."
        />
      {:else}
        <ul class="flex flex-col gap-1" data-testid="upcoming-tasks">
          {#each items as task (task.id)}
            {@const state = dueState(task.dueDate, today)}
            <li>
              <a
                href={taskHref(task.ideaId)}
                class="flex items-baseline justify-between gap-2 rounded-md p-2 hover:bg-muted"
              >
                <span class="min-w-0">
                  <span class="block truncate font-medium">{task.title}</span>
                  <span class="block truncate text-xs text-muted-foreground">{task.ideaTitle}</span>
                </span>
                <span
                  class="shrink-0 text-xs {state === 'overdue'
                    ? 'font-medium text-destructive'
                    : 'text-muted-foreground'}"
                >
                  {LABEL[state]}
                  {formatDateOnly(task.dueDate)}
                </span>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    {/snippet}
  </AsyncView>
</div>
