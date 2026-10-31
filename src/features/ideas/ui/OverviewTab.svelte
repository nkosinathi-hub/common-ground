<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { Textarea } from "$lib/components/ui/textarea"
  import { FormError } from "@/shared/ui"
  import { BRIEF_MAX, type Idea } from "../domain"
  import BriefDetails from "./BriefDetails.svelte"
  import BriefMerge from "./BriefMerge.svelte"
  import { useIdeas } from "./context"
  import { OverviewState } from "./overview-state.svelte"

  interface Props {
    idea: Idea
    onSaved: (idea: Idea) => void
  }

  let { idea, onSaved }: Props = $props()
  // The editor owns its copy from mount; IdeaDetail remounts it per idea.
  const brief = untrack(() => new OverviewState(useIdeas().service, idea, onSaved))
  function submit(event: SubmitEvent) {
    event.preventDefault()
    void brief.save()
  }
</script>

{#if brief.latest}
  <BriefMerge
    mine={brief.draft}
    latest={brief.latest}
    onCancel={() => (brief.latest = null)}
    onResolve={(merged) => brief.latest && brief.save(merged, brief.latest)}
  />
{:else}
  <!-- D06: the plan in a few words, then the details; one save covers both. -->
  <form class="flex flex-col gap-stack" onsubmit={submit} aria-label="Overview">
    <Card.Root>
      <Card.Header><Card.Title id="pitch-heading">The plan, in a few words</Card.Title></Card.Header
      >
      <Card.Content class="flex flex-col gap-stack">
        <Textarea
          id="brief-pitch"
          aria-labelledby="pitch-heading"
          maxlength={BRIEF_MAX}
          rows={3}
          value={brief.draft.pitch ?? ""}
          oninput={(event) => brief.set("pitch", event.currentTarget.value)}
          aria-invalid={brief.fieldError?.field === "pitch" ? true : undefined}
        />
        <FormError message={brief.fieldError?.message ?? null} />
        <div class="flex items-center gap-item">
          <Button type="submit" disabled={brief.busy || !brief.unsaved}>Save overview</Button>
          {#if brief.unsaved}<Button type="button" variant="ghost" onclick={brief.discard}
              >Discard</Button
            >
            <span class="ml-auto type-xs text-muted-foreground" role="status">Unsaved changes</span
            >{/if}
        </div>
      </Card.Content>
    </Card.Root>
    <BriefDetails {brief} template={idea.template} />
  </form>
{/if}
