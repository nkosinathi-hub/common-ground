<script lang="ts">
  import { untrack } from "svelte"
  import type { Cursor } from "@/shared/domain"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { DeleteButton, PagedList } from "@/shared/ui"
  import {
    canDelete,
    HYPOTHESIS_MAX,
    HYPOTHESIS_STATUSES,
    type Hypothesis,
    type HypothesisStatus,
    type Idea,
    type Viewer,
  } from "../domain"
  import { useResearch } from "./context"
  import { HYPOTHESIS_LABELS } from "./labels"
  import ListFooter from "./ListFooter.svelte"

  interface Props {
    idea: Idea
    viewer: Viewer
  }

  let { idea, viewer }: Props = $props()
  const research = useResearch().service
  const list = new PagedList<Hypothesis, Cursor>((after) => research.hypotheses(idea.id, after))
  // Loads on mount and when the idea id changes; edits to the idea replace the prop, not the id.
  const ideaId = $derived(idea.id)
  $effect(() => {
    void ideaId
    untrack(() => list.load())
  })

  let statement = $state("")
  let error = $state<string | null>(null)

  async function add(event: SubmitEvent) {
    event.preventDefault()
    const failure = await list.add(research.addHypothesis(idea.spaceId, idea.id, statement))
    error = failure?.message ?? null
    if (!failure) statement = ""
  }
  async function setStatus(id: string, status: HypothesisStatus) {
    error = (await list.replace(research.setHypothesisStatus(id, status)))?.message ?? null
  }
  async function remove(id: string) {
    error = (await list.remove(id, research.removeHypothesis(id)))?.message ?? null
  }
</script>

<section aria-labelledby="hypotheses-heading" class="flex flex-col gap-3">
  <h2 id="hypotheses-heading" class="text-lg font-semibold">Hypotheses</h2>
  <form class="flex gap-2" onsubmit={add}>
    <Input
      aria-label="New hypothesis"
      placeholder="We believe that..."
      maxlength={HYPOTHESIS_MAX}
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
            onchange={(event) =>
              setStatus(hypothesis.id, event.currentTarget.value as HypothesisStatus)}
          >
            {#each HYPOTHESIS_STATUSES as status (status)}<option value={status}
                >{HYPOTHESIS_LABELS[status]}</option
              >{/each}
          </select>
          {#if canDelete(hypothesis.createdBy, viewer)}
            <DeleteButton
              label="Delete hypothesis"
              what="this hypothesis"
              onConfirm={() => remove(hypothesis.id)}
            />
          {/if}
        </div>
      </li>
    {/each}
  </ul>
  <ListFooter {list} empty="No hypotheses yet." />
</section>
