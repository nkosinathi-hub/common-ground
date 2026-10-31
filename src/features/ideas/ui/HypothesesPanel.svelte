<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import { Label } from "$lib/components/ui/label"
  import { untrack } from "svelte"
  import { canDelete, type Cursor, type Viewer } from "@/shared/domain"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { FormError, PagedList } from "@/shared/ui"
  import { HYPOTHESIS_MAX, type Hypothesis, type HypothesisStatus, type Idea } from "../domain"
  import { useResearch } from "./context"
  import HypothesisItem from "./HypothesisItem.svelte"
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
    untrack(() => void list.load())
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

<!-- D07 Hypotheses: each statement with its status as a segmented control, then add one. -->
<Card.Root role="region" aria-labelledby="hypotheses-heading">
  <Card.Header>
    <Card.Title id="hypotheses-heading">Hypotheses</Card.Title>
    <Card.Description>Questions to test, not things we already know.</Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    <ul class="flex flex-col gap-item">
      {#each list.items as hypothesis (hypothesis.id)}
        <HypothesisItem
          {hypothesis}
          deletable={canDelete(hypothesis.createdBy, viewer)}
          onStatus={(status) => setStatus(hypothesis.id, status)}
          onRemove={() => remove(hypothesis.id)}
        />
      {/each}
    </ul>
    <ListFooter {list} empty="No hypotheses yet." />
    <form class="flex flex-col gap-related" onsubmit={add}>
      <Label for="new-hypothesis">New hypothesis</Label>
      <div class="flex gap-item">
        <Input
          id="new-hypothesis"
          placeholder="We believe that…"
          maxlength={HYPOTHESIS_MAX}
          bind:value={statement}
        />
        <Button type="submit" disabled={!statement.trim()}>Add</Button>
      </div>
      <FormError message={error} />
    </form>
  </Card.Content>
</Card.Root>
