<script lang="ts">
  import { DoorOpen } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { buildHash } from "@/shared/domain"
  import { AsyncView, FormState, Resource } from "@/shared/ui"
  import type { InvitePreviewStatus } from "../domain/space"
  import { useSpaces } from "./context"

  interface Props {
    token: string
  }

  const COPY: Record<Exclude<InvitePreviewStatus, "valid">, string> = {
    invalid: "This invitation link is not valid. Ask for a new one.",
    used: "This invitation was already used. Each link works once.",
    revoked: "This invitation was cancelled by the space owner.",
    expired: "This invitation expired. Links last seven days.",
    member: "You are already in this space.",
  }

  let { token }: Props = $props()
  const { service, store } = useSpaces()
  const preview = new Resource(() => service.previewInvite(token))
  const form = new FormState()
  $effect(() => void preview.load())

  async function accept() {
    const joined = await form.run(() => service.redeemInvite(token))
    if (!joined.ok) return
    await store.refresh()
    location.hash = buildHash({ name: "home", spaceId: joined.value })
  }
</script>

<main class="flex min-h-dvh items-center justify-center px-4">
  <Card.Root class="w-full max-w-md">
    <AsyncView resource={preview}>
      {#snippet children(info)}
        <Card.Header>
          <DoorOpen class="size-6 text-primary" aria-hidden="true" />
          <Card.Title level={1}
            >{info.status === "valid" ? `Join ${info.spaceName}` : "Invitation"}</Card.Title
          >
          {#if info.status === "valid" && info.inviterName}
            <Card.Description>{info.inviterName} invited you.</Card.Description>
          {/if}
        </Card.Header>
        <Card.Content class="grid gap-3">
          {#if info.status === "valid"}
            {#if form.formError}<p role="alert" class="text-sm text-destructive">
                {form.formError}
              </p>{/if}
            <Button onclick={accept} disabled={form.pending}>Accept and join</Button>
          {:else}
            <p>{COPY[info.status]}</p>
            <Button variant="outline" href="#/">Go to my spaces</Button>
          {/if}
        </Card.Content>
      {/snippet}
    </AsyncView>
  </Card.Root>
</main>
