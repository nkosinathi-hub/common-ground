<script lang="ts">
  import { untrack } from "svelte"
  import { CalendarCheck } from "@lucide/svelte"
  import { formatDateOnly, todayDateOnly } from "@/shared/domain"
  import { Badge } from "$lib/components/ui/badge"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { AsyncView, EmptyState, Resource, TextLink } from "@/shared/ui"
  import { dueState, type UpcomingTask } from "../domain"
  import { useTasks } from "./context"
  import { PRIORITY_LABELS } from "./labels"

  const LABEL = { overdue: "Overdue", today: "Due today", soon: "Due" } as const

  interface Props {
    spaceId: string
    taskHref: (ideaId: string) => string
    /** Phones show only the first in their Up next card. */
    limit?: number
  }

  let { spaceId, taskHref, limit }: Props = $props()
  const service = useTasks().tasks
  const tasks = new Resource<UpcomingTask[]>(() => service.upcoming(untrack(() => spaceId)))
  // Reloads when Home switches to another space.
  $effect(() => {
    void spaceId
    untrack(() => void tasks.load())
  })

  const today = todayDateOnly()
  async function done(id: string) {
    await service.move(id, "done")
    await tasks.load()
  }
</script>

<!-- Figma Task row (210:4494): tick it done from Home, or open its idea. -->
<AsyncView resource={tasks}>
  {#snippet children(items)}
    {#if items.length === 0}
      <EmptyState
        icon={CalendarCheck}
        title="Nothing due"
        description="Tasks with a due date show up here."
      />
    {:else}
      <ul class="flex flex-col gap-item" data-testid="upcoming-tasks">
        {#each items.slice(0, limit) as task (task.id)}
          {@const state = dueState(task.dueDate, today)}
          <li class="flex items-start gap-item">
            <Checkbox
              class="mt-0.5"
              aria-label="Done: {task.title}"
              onCheckedChange={() => done(task.id)}
            />
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="truncate type-label text-foreground">{task.title}</span>
              <span class="type-xs text-muted-foreground">
                {[task.assigneeName, `${PRIORITY_LABELS[task.priority]} priority`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <TextLink href={taskHref(task.ideaId)} class="block h-auto max-w-full truncate"
                >{task.ideaTitle || "Open its idea"}</TextLink
              >
            </div>
            <Badge variant={state === "overdue" ? "destructive" : "outline"}>
              {LABEL[state]}{state === "soon" ? ` ${formatDateOnly(task.dueDate)}` : ""}
            </Badge>
          </li>
        {/each}
      </ul>
    {/if}
  {/snippet}
</AsyncView>
