<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import * as Card from "$lib/components/ui/card"
  import type { Snippet } from "svelte"
  import { memberName, type MemberRef } from "@/shared/domain"
  import { AvatarStack, DetailRow } from "@/shared/ui"
  import { peopleOf, type Idea } from "../domain"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    idea: Idea
    authors: readonly MemberRef[]
    /** The plan's rows (next milestone, open tasks, budget), from the features that own them. */
    rows?: Snippet<[Idea]>
  }

  let { idea, authors, rows }: Props = $props()
  const people = $derived(peopleOf(idea).map((id) => ({ name: memberName(authors, id) })))
</script>

<!-- D06 At a glance: who, where it stands, what is next and what it costs. -->
<Card.Root role="region" aria-labelledby="glance-heading">
  <Card.Header><Card.Title id="glance-heading">At a glance</Card.Title></Card.Header>
  <Card.Content class="flex flex-col">
    <DetailRow label="People">
      <span class="inline-flex"
        ><AvatarStack {people} label={people.map((p) => p.name).join(", ")} size="sm" /></span
      >
    </DetailRow>
    <DetailRow label="Stage"><Badge>{STAGE_LABELS[idea.stage]}</Badge></DetailRow>
    {@render rows?.(idea)}
  </Card.Content>
</Card.Root>
