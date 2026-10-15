<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Flag } from "@lucide/svelte"
  import type { AppError, Result } from "@/shared/domain"
  import { ErrorState, Loading } from "@/shared/ui"
  import { milestoneProgress, type Milestone } from "../domain"
  import { useTasks } from "./context"
  import MilestoneItem from "./MilestoneItem.svelte"

  let { spaceId, ideaId }: { spaceId: string; ideaId: string } = $props()
  const uc = useTasks()
  let items = $state<Milestone[]>([])
  let loadError = $state<AppError | null>(null)
  let loading = $state(true)
  let draft = $state({ title: "", targetDate: "" })
  let error = $state<AppError | null>(null)

  async function load() {
    loading = true
    const result = await uc.milestones(ideaId)
    loading = false
    if (result.ok) items = result.value
    loadError = result.ok ? null : result.error
  }
  $effect(() => void load())

  async function run<T>(write: Promise<Result<T>>, apply: (value: T) => void) {
    const result = await write
    if (result.ok) apply(result.value)
    error = result.ok ? null : result.error
  }
  const replace = (m: Milestone) => (items = items.map((i) => (i.id === m.id ? m : i)))
  const add = (e: SubmitEvent) => (
    e.preventDefault(),
    run(
      uc.addMilestone(spaceId, ideaId, {
        title: draft.title,
        targetDate: draft.targetDate || null,
      }),
      (m) => ((items = [...items, m]), (draft = { title: "", targetDate: "" })),
    )
  )
  const progress = $derived(milestoneProgress(items))
</script>

<section aria-labelledby="milestones-heading" class="flex flex-col gap-3">
  <h2 id="milestones-heading" class="text-lg font-semibold">
    Milestones {#if progress.total}<span class="text-sm text-muted-foreground"
        >({progress.done} of {progress.total} complete)</span
      >{/if}
  </h2>
  <form class="flex flex-wrap items-end gap-2" onsubmit={add}>
    <Input
      class="w-56"
      aria-label="Milestone title"
      placeholder="New milestone"
      maxlength={200}
      bind:value={draft.title}
      aria-invalid={error?.field === "title" ? true : undefined}
    />
    <label class="flex flex-col text-xs"
      >Target date <Input type="date" class="h-8" bind:value={draft.targetDate} /></label
    >
    <Button type="submit" size="sm" disabled={!draft.title.trim()}><Flag />Add milestone</Button>
  </form>
  {#if error}<p class="text-sm text-destructive" role="alert">{error.message}</p>{/if}
  {#if loadError}
    <ErrorState error={loadError} onRetry={load} />
  {:else if loading}
    <Loading rows={2} />
  {:else}
    <ul class="flex flex-col gap-2">
      {#each items as m (m.id)}
        <MilestoneItem
          milestone={m}
          onToggle={(done) => run(uc.completeMilestone(m.id, done), replace)}
          onRemove={() =>
            run(uc.removeMilestone(m.id), () => (items = items.filter((i) => i.id !== m.id)))}
        />
      {:else}
        <li class="text-sm text-muted-foreground">No milestones yet.</li>
      {/each}
    </ul>
  {/if}
</section>
