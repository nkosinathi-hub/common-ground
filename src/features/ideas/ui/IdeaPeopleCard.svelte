<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import { memberName, type MemberRef } from "@/shared/domain"
  import { ListRow, InitialAvatar } from "@/shared/ui"
  import type { Idea } from "../domain"

  let { idea, authors }: { idea: Idea; authors: readonly MemberRef[] } = $props()
  // The author first, then everyone invited: accepted collaborators, then pending invites.
  const people = $derived([
    ...(idea.createdBy ? [{ id: idea.createdBy, role: "Started this idea" }] : []),
    ...idea.collaborators
      .filter((c) => c.userId !== idea.createdBy)
      .map((c) => ({ id: c.userId, role: c.acceptedAt ? "Collaborator" : "Invited" })),
  ])
  const names = $derived(people.map((p) => memberName(authors, p.id)))
  const mention = $derived(
    names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`,
  )
</script>

<!-- D11 aside: who is in on this idea, and how to bring them into the conversation. -->
<Card.Root role="region" aria-labelledby="idea-people-heading">
  <Card.Header><Card.Title id="idea-people-heading">People in this idea</Card.Title></Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    <ul class="flex flex-col">
      {#each people as person, i (person.id)}
        <li>
          <ListRow title={names[i] ?? ""} meta={person.role}>
            {#snippet leading()}<InitialAvatar
                name={names[i] ?? ""}
                size="sm"
                decorative
              />{/snippet}
          </ListRow>
        </li>
      {/each}
    </ul>
    <p class="type-xs text-muted-foreground">
      Mention {mention} with @. Comments marked as spoilers stay hidden until revealed.
    </p>
  </Card.Content>
</Card.Root>
