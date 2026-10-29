<script lang="ts">
  import { untrack } from "svelte"
  import { ArrowRight } from "@lucide/svelte"
  import { formatDateOnly } from "@/shared/domain"
  import { DetailRow, Resource, TextLink } from "@/shared/ui"
  import { useTasks } from "./context"

  interface Props {
    ideaId: string
    tasksHref: string
  }

  let { ideaId, tasksHref }: Props = $props()
  const { milestones, tasks } = useTasks()
  const plan = new Resource(() => milestones.list(untrack(() => ideaId)))
  const list = new Resource(() =>
    tasks.list(
      untrack(() => ideaId),
      null,
    ),
  )
  $effect(() => {
    void ideaId
    untrack(() => void (plan.load(), list.load()))
  })
  const next = $derived((plan.value ?? []).find((m) => m.completedAt === null))
  const open = $derived((list.value?.items ?? []).filter((t) => t.status !== "done").length)
</script>

<!-- D06 At a glance: the next milestone and how many tasks are still open. -->
{#if next}
  <DetailRow
    label="Milestone"
    value={[next.title, next.targetDate && formatDateOnly(next.targetDate)]
      .filter(Boolean)
      .join(" · ")}
  />
{/if}
{#if list.value}
  <div class="pt-item">
    <TextLink href={tasksHref} icon={ArrowRight}>
      {open === 0 ? "No open tasks" : `${open} open ${open === 1 ? "task" : "tasks"}`}
    </TextLink>
  </div>
{/if}
