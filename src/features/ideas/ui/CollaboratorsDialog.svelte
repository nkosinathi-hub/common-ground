<script lang="ts">
  import { untrack } from "svelte"
  import { SvelteSet } from "svelte/reactivity"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import type { MemberRef, Result } from "@/shared/domain"
  import { toast } from "@/shared/ui"
  import { rosterChanges, type Idea } from "../domain"
  import { useIdeas } from "./context"

  interface Props {
    open: boolean
    idea: Idea
    members: readonly MemberRef[]
    onSaved: () => void
  }

  let { open = $bindable(), idea, members, onSaved }: Props = $props()
  const ideas = useIdeas()
  const invites = $derived(new Map(idea.collaborators.map((c) => [c.userId, c])))
  // Starts from who is on the idea now; the author is always on it.
  const picked = new SvelteSet(untrack(() => idea.collaborators.map((c) => c.userId)))
  let saving = $state(false)

  const note = (id: string) => {
    if (id === idea.createdBy) return " (started it)"
    const invite = invites.get(id)
    return invite && invite.acceptedAt === null ? " (invited)" : ""
  }
  const toggle = (id: string, on: boolean) => (on ? picked.add(id) : picked.delete(id))
  const refused = (result: Result<void>) => {
    if (!result.ok) toast.error(result.error.message)
  }

  async function save(event: SubmitEvent) {
    event.preventDefault()
    saving = true
    const { invite, remove } = rosterChanges(idea, picked)
    refused(await ideas.invite(idea.id, invite))
    for (const userId of remove) refused(await ideas.removeCollaborator(idea.id, userId))
    saving = false
    open = false
    onSaved()
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>People on this idea</Dialog.Title>
      <Dialog.Description
        >Invite members to make it your idea together. They hear about new comments and stage
        changes.</Dialog.Description
      >
    </Dialog.Header>
    <form class="grid gap-4" onsubmit={save}>
      <fieldset class="grid gap-2">
        <legend class="mb-1 text-sm font-medium">Members</legend>
        {#each members as member (member.id)}
          <label class="flex min-h-11 items-center gap-2 text-sm sm:min-h-0">
            <input
              type="checkbox"
              class="accent-primary"
              checked={member.id === idea.createdBy || picked.has(member.id)}
              disabled={member.id === idea.createdBy}
              onchange={(e) => toggle(member.id, e.currentTarget.checked)}
            />
            {member.displayName}{note(member.id)}
          </label>
        {/each}
      </fieldset>
      <Dialog.Footer>
        <Button type="submit" disabled={saving}>Save</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
