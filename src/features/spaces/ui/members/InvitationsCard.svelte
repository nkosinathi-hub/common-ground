<script lang="ts">
  import { Copy, Link } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { FORMER_MEMBER } from "@/shared/domain"
  import { InitialAvatar, toast } from "@/shared/ui"
  import type { Invite, Member } from "../../domain/space"
  import { canRevoke, inviteLine } from "./invite-line"

  interface Props {
    invites: readonly Invite[]
    members: readonly Member[]
    me: string
    owner: boolean
    onCreate: () => Promise<string | null>
    onRevoke: (id: string) => Promise<void>
  }

  let { invites, members, me, owner, onCreate, onRevoke }: Props = $props()
  const open = $derived(invites.filter((invite) => invite.status === "open"))
  const nameOf = (id: string | null) =>
    members.find((m) => m.userId === id)?.displayName ?? FORMER_MEMBER
  let link = $state<string | null>(null)
  let busy = $state(false)

  async function create() {
    busy = true
    link = (await onCreate()) ?? link
    busy = false
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link ?? "")
      toast.success("Link copied. Send it to one person; it works once.")
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.")
    }
  }
</script>

<!-- D17 Invitations: the count, Create link, the new link to copy, then every open link. -->
<div class="flex flex-wrap items-start justify-between gap-item">
  <div class="flex flex-col gap-hairline">
    <p class="type-label text-foreground">
      {open.length} active invitation{open.length === 1 ? "" : "s"}
    </p>
    <p class="type-sm text-muted-foreground">
      {owner ? "Unused links can be revoked at any time." : "You can revoke the links you create."}
    </p>
  </div>
  <Button onclick={create} disabled={busy}><Link aria-hidden="true" />Create link</Button>
</div>
{#if link}
  <div class="flex items-center gap-related rounded-md bg-muted p-related">
    <code class="min-w-0 flex-1 truncate type-xs">{link}</code>
    <Button size="sm" variant="outline" onclick={copy}><Copy aria-hidden="true" />Copy link</Button>
  </div>
  <p class="type-xs text-muted-foreground">
    This link is shown once. Create a new one if you lose it.
  </p>
{/if}
<ul class="flex flex-col">
  {#each open as invite (invite.id)}
    {@const mine = invite.createdBy === me}
    <li class="flex items-center gap-item py-related">
      <InitialAvatar
        name={nameOf(invite.createdBy)}
        tone={mine ? "brand" : "secondary"}
        decorative
      />
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="type-label text-foreground"
          >Created by {mine ? "you" : nameOf(invite.createdBy)}</span
        >
        <span class="type-xs text-muted-foreground">{inviteLine(invite, Date.now())}</span>
      </div>
      {#if canRevoke(invite, me, owner)}
        <Button variant="link" class="px-0" onclick={() => onRevoke(invite.id)}>Revoke</Button>
      {/if}
    </li>
  {/each}
</ul>
