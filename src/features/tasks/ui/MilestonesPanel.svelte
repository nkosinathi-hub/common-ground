<script lang="ts">
  import { untrack } from "svelte"
  import type { AppError, Result } from "@/shared/domain"
  import { AsyncView, Resource } from "@/shared/ui"
  import { milestoneProgress, type Milestone, type MilestoneInput } from "../domain"
  import { STALE_COPY } from "./conflict"
  import { useTasks } from "./context"
  import MilestoneForm from "./MilestoneForm.svelte"
  import MilestoneItem from "./MilestoneItem.svelte"

  type Change<T> = (value: T, items: Milestone[]) => Milestone[]

  interface Props {
    spaceId: string
    ideaId: string
    /** Whether the viewer may delete a row by this author (the author or the space owner). */
    canDelete: (createdBy: string | null) => boolean
  }

  let { spaceId, ideaId, canDelete }: Props = $props()
  const { milestones } = useTasks()
  const list = new Resource<Milestone[]>(() => milestones.list(untrack(() => ideaId)))
  let error = $state<AppError | null>(null)
  // Reloads when the page shows another idea.
  $effect(() => {
    void ideaId
    untrack(() => void list.load())
  })

  /**
   * Applies a write. A stale edit shows the conflict copy and reloads the list; it still reports
   * done so the edit form closes onto their version. False keeps the form open to fix an error.
   */
  async function run<T>(write: Promise<Result<T>>, change: Change<T>): Promise<boolean> {
    const result = await write
    if (result.ok) list.set(change(result.value, list.value ?? []))
    error = result.ok ? null : result.error
    if (result.ok || result.error.kind !== "conflict") return result.ok
    error = { ...result.error, message: STALE_COPY }
    await list.load()
    return true
  }

  const replace: Change<Milestone> = (saved, items) =>
    items.map((item) => (item.id === saved.id ? saved : item))
  const add = (input: MilestoneInput) =>
    run(milestones.add({ spaceId, ideaId }, input), (added, items) => [...items, added])
  const remove = (id: string) =>
    run(milestones.remove(id), (_removed, items) => items.filter((item) => item.id !== id))
  const progress = $derived(milestoneProgress(list.value ?? []))
</script>

<section aria-labelledby="milestones-heading" class="flex flex-col gap-3">
  <h2 id="milestones-heading" class="text-lg font-semibold">
    Milestones {#if progress.total}<span class="text-sm text-muted-foreground"
        >({progress.done} of {progress.total} complete)</span
      >{/if}
  </h2>
  <MilestoneForm {error} onAdd={add} />
  {#if error}<p class="text-sm text-destructive" role="alert">{error.message}</p>{/if}
  <AsyncView resource={list}>
    {#snippet children(items)}
      <ul class="flex flex-col gap-2">
        {#each items as milestone (milestone.id)}
          <MilestoneItem
            {milestone}
            deletable={canDelete(milestone.createdBy)}
            onToggle={(done) => run(milestones.complete(milestone, done), replace)}
            onEdit={(input) => run(milestones.retarget(milestone, input), replace)}
            onRemove={() => remove(milestone.id)}
          />
        {:else}
          <li class="text-sm text-muted-foreground">No milestones yet.</li>
        {/each}
      </ul>
    {/snippet}
  </AsyncView>
</section>
