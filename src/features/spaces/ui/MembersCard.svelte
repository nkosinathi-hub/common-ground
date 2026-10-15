<script lang="ts">
  import { Crown } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { AsyncView, ConfirmDialog, Resource, toast } from "@/shared/ui"
  import type { Member, Space } from "../domain/space"
  import { useSpaces } from "./context"
  import { MEMBER_ACTIONS, type MemberAction } from "./member-actions"

  interface Props {
    space: Space
    me: string
  }

  interface Pending {
    readonly member: Member
    readonly action: MemberAction
  }

  let { space, me }: Props = $props()
  const { service, store } = useSpaces()
  const members = new Resource(() => service.members(space.id))
  $effect(() => void members.load())
  let pending = $state<Pending | null>(null)
  let open = $state(false)
  const copy = $derived(pending ? MEMBER_ACTIONS[pending.action] : null)

  function ask(member: Member, action: MemberAction) {
    pending = { member, action }
    open = true
  }

  async function confirm() {
    if (!pending) return
    const { member, action } = pending
    const result =
      action === "remove"
        ? await service.removeMember(space.id, member.userId)
        : await service.transferOwnership(space.id, member.userId)
    pending = null
    if (!result.ok) {
      toast.error(result.error.message)
      return
    }
    toast.success(MEMBER_ACTIONS[action].done(member.displayName))
    await Promise.all([members.load(), store.refresh()])
  }
</script>

<Card.Root>
  <Card.Header><Card.Title>Members</Card.Title></Card.Header>
  <Card.Content>
    <AsyncView resource={members}>
      {#snippet children(list)}
        <ul class="divide-y">
          {#each list as member (member.userId)}
            <li class="flex flex-wrap items-center gap-2 py-3">
              <span class="flex-1 font-medium"
                >{member.displayName}{member.userId === me ? " (you)" : ""}</span
              >
              {#if member.role === "owner"}<Badge variant="secondary"
                  ><Crown class="size-3" aria-hidden="true" />Owner</Badge
                >{/if}
              {#if space.role === "owner" && member.userId !== me}
                <Button size="sm" variant="ghost" onclick={() => ask(member, "transfer")}
                  >Make owner</Button
                >
                <Button
                  size="sm"
                  variant="ghost"
                  class="text-destructive"
                  onclick={() => ask(member, "remove")}>Remove</Button
                >
              {/if}
            </li>
          {/each}
        </ul>
      {/snippet}
    </AsyncView>
  </Card.Content>
</Card.Root>

{#if pending && copy}
  <ConfirmDialog
    bind:open
    title={copy.title(pending.member.displayName)}
    description={copy.description}
    confirmLabel={copy.confirmLabel}
    destructive={copy.destructive}
    onConfirm={confirm}
  />
{/if}
