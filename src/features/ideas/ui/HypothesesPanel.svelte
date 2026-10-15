<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Trash2 } from "@lucide/svelte"
  import { HYPOTHESIS_STATUSES, type Hypothesis, type HypothesisStatus, type Idea } from "../domain"
  import { useResearch } from "./context"
  import ListFooter from "./ListFooter.svelte"
  import { PagedList } from "./paged-list.svelte"

  let { idea }: { idea: Idea } = $props()
  const research = useResearch()
  const list = new PagedList<Hypothesis>((after) => research.hypotheses(idea.id, after))
  $effect(() => void list.load())

  const LABELS: Record<HypothesisStatus, string> = {
    untested: "Untested",
    validated: "Validated",
    invalidated: "Invalidated",
  }
  let statement = $state("")
  let error = $state<string | null>(null)

  async function add(event: SubmitEvent) {
    event.preventDefault()
    const failure = await list.add(research.addHypothesis(idea.spaceId, idea.id, statement))
    error = failure?.message ?? null
    if (!failure) statement = ""
  }
  const setStatus = async (id: string, status: HypothesisStatus) => {
    error = (await list.replace(research.setHypothesisStatus(id, status)))?.message ?? null
  }
</script>

<section aria-labelledby="hypotheses-heading" class="flex flex-col gap-3">
  <h2 id="hypotheses-heading" class="text-lg font-semibold">Hypotheses</h2>
  <form class="flex gap-2" onsubmit={add}>
    <Input
      aria-label="New hypothesis"
      placeholder="We believe that..."
      maxlength={1000}
      bind:value={statement}
    />
    <Button type="submit" size="sm" disabled={!statement.trim()}>Add</Button>
  </form>
  {#if error}<p class="text-sm text-destructive" role="alert">{error}</p>{/if}
  <ul class="flex flex-col gap-2">
    {#each list.items as hypothesis (hypothesis.id)}
      <li
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
        data-testid="hypothesis"
      >
        <p class="text-sm">{hypothesis.statement}</p>
        <div class="flex items-center gap-1">
          <select
            aria-label="Status"
            class="h-7 rounded-md border border-input bg-background px-1 text-xs"
            value={hypothesis.status}
            onchange={(e) => setStatus(hypothesis.id, e.currentTarget.value as HypothesisStatus)}
          >
            {#each HYPOTHESIS_STATUSES as status (status)}<option value={status}
                >{LABELS[status]}</option
              >{/each}
          </select>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete hypothesis"
            onclick={() => list.remove(hypothesis.id, research.removeHypothesis(hypothesis.id))}
            ><Trash2 /></Button
          >
        </div>
      </li>
    {/each}
  </ul>
  <ListFooter {list} empty="No hypotheses yet." />
</section>
