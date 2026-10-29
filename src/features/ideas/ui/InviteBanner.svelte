<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { memberName, type MemberRef } from "@/shared/domain"
  import { toast } from "@/shared/ui"
  import { invitationFor, type Idea } from "../domain"
  import { useIdeas } from "./context"

  interface Props {
    idea: Idea
    me: string
    /** Names the inviter, even after they were removed while still visible. */
    authors: readonly MemberRef[]
    onAnswered: () => void
  }

  let { idea, me, authors, onAnswered }: Props = $props()
  const ideas = useIdeas().service
  const invite = $derived(invitationFor(idea, me))
  let pending = $state(false)

  async function answer(accept: boolean) {
    pending = true
    const result = await ideas.respond(idea.id, accept)
    pending = false
    if (!result.ok) toast.error(result.error.message)
    onAnswered()
  }
</script>

{#if invite}
  <section
    aria-label="Invitation"
    class="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-secondary p-3"
  >
    <p class="text-sm">
      {memberName(authors, invite.invitedBy)} invited you to work on this idea. Joining makes it our idea;
      you hear about new comments and stage changes.
    </p>
    <div class="flex gap-2">
      <Button size="sm" disabled={pending} onclick={() => answer(true)}>Accept</Button>
      <Button size="sm" variant="outline" disabled={pending} onclick={() => answer(false)}
        >Decline</Button
      >
    </div>
  </section>
{/if}
