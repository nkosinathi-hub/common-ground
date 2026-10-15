<script lang="ts">
  import { Copy, Link } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { AsyncView, Resource, toast } from "@/shared/ui"
  import type { Space } from "../domain/space"
  import { useSpaces } from "./context"

  let { space }: { space: Space } = $props()
  const { service } = useSpaces()
  const invites = new Resource(() => service.invites(space.id))
  $effect(() => void invites.load())
  let link = $state<string | null>(null)
  let busy = $state(false)

  async function create() {
    busy = true
    const made = await service.createInviteLink(space.id)
    busy = false
    if (!made.ok) return toast.error(made.error.message)
    link = made.value
    await invites.load()
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast.success("Link copied. Send it to one person; it works once.")
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.")
    }
  }

  async function revoke(id: string) {
    const done = await service.revokeInvite(id)
    if (!done.ok) return toast.error(done.error.message)
    await invites.load()
  }

  const date = (iso: string) => new Date(iso).toLocaleDateString()
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Invitations</Card.Title>
    <Card.Description
      >Each link lets one signed-in person join, and expires after seven days.</Card.Description
    >
  </Card.Header>
  <Card.Content class="grid gap-4">
    <Button class="w-fit" onclick={create} disabled={busy}
      ><Link class="size-4" aria-hidden="true" />Create invite link</Button
    >
    {#if link}
      <div class="flex items-center gap-2 rounded-lg bg-muted p-2">
        <code class="min-w-0 flex-1 truncate text-xs">{link}</code>
        <Button size="sm" variant="outline" onclick={copy}
          ><Copy class="size-4" aria-hidden="true" />Copy</Button
        >
      </div>
      <p class="text-xs text-muted-foreground">
        This link is shown once. Create a new one if you lose it.
      </p>
    {/if}
    <AsyncView resource={invites}>
      {#snippet children(list)}
        <ul class="divide-y text-sm">
          {#each list as invite (invite.id)}
            <li class="flex items-center gap-2 py-2">
              <span class="flex-1"
                >Created {date(invite.createdAt)}, expires {date(invite.expiresAt)}</span
              >
              <Badge variant={invite.status === "open" ? "default" : "secondary"}
                >{invite.status}</Badge
              >
              {#if invite.status === "open"}
                <Button size="sm" variant="ghost" onclick={() => revoke(invite.id)}>Revoke</Button>
              {/if}
            </li>
          {:else}
            <li class="py-2 text-muted-foreground">No invitations yet.</li>
          {/each}
        </ul>
      {/snippet}
    </AsyncView>
  </Card.Content>
</Card.Root>
