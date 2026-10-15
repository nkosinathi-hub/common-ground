<script lang="ts">
  import { untrack } from "svelte"
  import { CalendarCheck } from "@lucide/svelte"
  import { todayDateOnly } from "@/shared/domain"
  import { AsyncView, EmptyState, Resource } from "@/shared/ui"
  import { dueState, formatDue, type UpcomingTask } from "../domain"
  import { useTasks } from "./context"

  let { spaceId, taskHref }: { spaceId: string; taskHref: (ideaId: string) => string } = $props()
  const uc = useTasks()
  const tasks = new Resource<UpcomingTask[]>(() => uc.upcoming(untrack(() => spaceId)))
  $effect(() => {
    void spaceId
    void tasks.load()
  })

  const today = todayDateOnly()
  const LABEL = { overdue: "Overdue", today: "Due today", soon: "Due" } as const
</script>

<section aria-labelledby="upcoming-heading" class="flex flex-col gap-2">
  <h2 id="upcoming-heading" class="text-lg font-semibold">Upcoming tasks</h2>
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
                  {formatDue(task.dueDate)}
                </span>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    {/snippet}
  </AsyncView>
</section>
