<script lang="ts">
  import { untrack } from "svelte"
  import { SvelteSet } from "svelte/reactivity"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { Label } from "$lib/components/ui/label"
  import type { MemberRef, Result } from "@/shared/domain"
  import { DialogShell, InitialAvatar, toast } from "@/shared/ui"
  import { rosterChanges, type Idea } from "../domain"
  import { useIdeas } from "./context"

  interface Props {
    open: boolean
    idea: Idea
    members: readonly MemberRef[]
    onSaved: () => void
  }

  let { open = $bindable(), idea, members, onSaved }: Props = $props()
  const ideas = useIdeas().service
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

  async function save() {
    saving = true
    const { invite, remove } = rosterChanges(idea, picked)
    refused(await ideas.invite(idea.id, invite))
    for (const userId of remove) refused(await ideas.removeCollaborator(idea.id, userId))
    saving = false
    open = false
    onSaved()
  }
</script>

<!-- Who is on this idea: a checkbox row per member, the author always on it. -->
<DialogShell
  bind:open
  title="People on this idea"
  description="Invite members to make it your idea together. They hear about new comments and stage changes."
  primary="Save"
  busy={saving}
  onsubmit={save}
>
  <fieldset class="flex flex-col">
    <legend class="sr-only">Members</legend>
    {#each members as member (member.id)}
      {@const id = `collaborator-${member.id}`}
      <div class="flex min-h-11 items-center gap-item">
        <Checkbox
          {id}
          checked={member.id === idea.createdBy || picked.has(member.id)}
          disabled={member.id === idea.createdBy}
          onCheckedChange={(on) => toggle(member.id, on)}
        />
        <InitialAvatar name={member.displayName} size="sm" decorative />
        <Label for={id} class="type-label">{member.displayName}{note(member.id)}</Label>
      </div>
    {/each}
  </fieldset>
</DialogShell>
