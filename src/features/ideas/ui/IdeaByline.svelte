<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { UserPlus } from "@lucide/svelte"
  import { memberName, type MemberRef } from "@/shared/domain"
  import { isShared, peopleOf, type Idea } from "../domain"
  import CollaboratorsDialog from "./CollaboratorsDialog.svelte"
  import OursBadge from "./OursBadge.svelte"
  import PeopleStack from "./PeopleStack.svelte"

  interface Props {
    idea: Idea
    members: readonly MemberRef[]
    authors: readonly MemberRef[]
    onPeopleChanged: () => void
  }

  let { idea, members, authors, onPeopleChanged }: Props = $props()
  let open = $state(false)
  const names = $derived(peopleOf(idea).map((id) => memberName(authors, id)))
</script>

<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
  <span>Started by {memberName(authors, idea.createdBy)}</span>
  <PeopleStack {names} />
  {#if isShared(idea)}<OursBadge />{/if}
  <Button size="sm" variant="outline" onclick={() => (open = true)}
    ><UserPlus aria-hidden="true" />People</Button
  >
</div>
{#if open}
  <CollaboratorsDialog bind:open {idea} {members} onSaved={onPeopleChanged} />
{/if}
