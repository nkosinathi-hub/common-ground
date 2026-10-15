<script lang="ts">
  import type { AppError, Result } from "@/shared/domain"
  import { ErrorState, Loading } from "@/shared/ui"
  import { milestoneProgress, type Milestone, type MilestoneInput } from "../domain"
  import { STALE_COPY } from "./conflict"
  import { useTasks } from "./context"
  import MilestoneForm from "./MilestoneForm.svelte"
  import MilestoneItem from "./MilestoneItem.svelte"

  interface Props {
    spaceId: string
    ideaId: string
  }

  let { spaceId, ideaId }: Props = $props()
  const uc = useTasks()
  let items = $state<Milestone[]>([])
  let loadError = $state<AppError | null>(null)
  let loading = $state(true)
  let error = $state<AppError | null>(null)

  async function load() {
    loading = true
    const result = await uc.milestones(ideaId)
    loading = false
    if (result.ok) items = result.value
    loadError = result.ok ? null : result.error
  }
  $effect(() => void load())

  /** Applies a write; a stale edit shows the conflict copy and reloads the list. */
  async function run<T>(write: Promise<Result<T>>, apply: (value: T) => void) {
    const result = await write
    if (result.ok) apply(result.value)
    error = result.ok ? null : result.error
    if (!result.ok && result.error.kind === "conflict") {
      error = { ...result.error, message: STALE_COPY }
      await load()
    }
    return result.ok
  }
  const replace = (m: Milestone) => (items = items.map((i) => (i.id === m.id ? m : i)))
  const add = (input: MilestoneInput) =>
    run(uc.addMilestone(spaceId, ideaId, input), (m) => (items = [...items, m]))
  const progress = $derived(milestoneProgress(items))
</script>

<section aria-labelledby="milestones-heading" class="flex flex-col gap-3">
  <h2 id="milestones-heading" class="text-lg font-semibold">
    Milestones {#if progress.total}<span class="text-sm text-muted-foreground"
        >({progress.done} of {progress.total} complete)</span
      >{/if}
  </h2>
  <MilestoneForm {error} onAdd={add} />
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
          onToggle={(done) => run(uc.completeMilestone(m, done), replace)}
          onEdit={(input) => run(uc.retargetMilestone(m, input), replace)}
          onRemove={() =>
            run(uc.removeMilestone(m.id), () => (items = items.filter((i) => i.id !== m.id)))}
        />
      {:else}
        <li class="text-sm text-muted-foreground">No milestones yet.</li>
      {/each}
    </ul>
  {/if}
</section>
