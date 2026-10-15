<script lang="ts">
  import { Crown } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { AsyncView, ConfirmDialog, Resource, toast } from "@/shared/ui"
  import type { Member, Space } from "../domain/space"
  import { useSpaces } from "./context"

  let { space, me }: { space: Space; me: string } = $props()
  const { service, store } = useSpaces()
  const members = new Resource(() => service.members(space.id))
  $effect(() => void members.load())
  let pending = $state<{ member: Member; action: "remove" | "transfer" } | null>(null)
  let open = $state(false)
  const ask = (member: Member, action: "remove" | "transfer") => {
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
    if (!result.ok) return toast.error(result.error.message)
    toast.success(
      action === "remove"
        ? `${member.displayName} was removed`
        : `${member.displayName} now owns this space`,
    )
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

{#if pending}
  <ConfirmDialog
    bind:open
    title={pending.action === "remove"
      ? `Remove ${pending.member.displayName}?`
      : `Hand ownership to ${pending.member.displayName}?`}
    description={pending.action === "remove"
      ? "They lose access to everything in this space right away. What they wrote stays, credited to them."
      : "You become a regular member. Only the owner manages members and can delete the space."}
    confirmLabel={pending.action === "remove" ? "Remove" : "Transfer"}
    destructive={pending.action === "remove"}
    onConfirm={confirm}
  />
{/if}
