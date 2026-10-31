<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { CollapsibleGroup } from "@/shared/ui"
  import {
    BRIEF_FIELDS,
    BRIEF_MAX,
    IDEA_TEMPLATE_OPTIONS,
    type BriefField,
    type IdeaTemplate,
  } from "../domain"
  import { BRIEF_LABELS } from "./labels"
  import type { OverviewState } from "./overview-state.svelte"

  let { brief, template }: { brief: OverviewState; template: IdeaTemplate } = $props()
  const TITLES: Record<IdeaTemplate, string> = {
    blank: "More about it",
    business: "The business case",
    creative: "The project",
  }
  // The template's fields lead; the rest wait folded, so the page stays short.
  const focus = $derived(
    (IDEA_TEMPLATE_OPTIONS.find((option) => option.id === template)?.focus ?? []).filter(
      (field) => field !== "pitch",
    ),
  )
  const rest = $derived(BRIEF_FIELDS.filter((f) => f !== "pitch" && !focus.includes(f)))
</script>

{#snippet fieldBox(field: BriefField)}
  <div class="flex flex-col gap-related">
    <Label for="brief-{field}">{BRIEF_LABELS[field]}</Label>
    <Textarea
      id="brief-{field}"
      maxlength={BRIEF_MAX}
      rows={2}
      value={brief.draft[field] ?? ""}
      oninput={(event) => brief.set(field, event.currentTarget.value)}
      aria-invalid={brief.fieldError?.field === field ? true : undefined}
    />
  </div>
{/snippet}

<!-- D06 details card: the template's own fields, then the rest folded away. -->
<Card.Root>
  <Card.Header><Card.Title>{TITLES[template]}</Card.Title></Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    {#each focus as field (field)}{@render fieldBox(field)}{/each}
    {#if rest.length > 0}
      <CollapsibleGroup
        title={focus.length ? "More fields" : "Add detail"}
        meta={String(rest.length)}
      >
        <div class="flex flex-col gap-stack pt-inset">
          {#each rest as field (field)}{@render fieldBox(field)}{/each}
        </div>
      </CollapsibleGroup>
    {/if}
  </Card.Content>
</Card.Root>
