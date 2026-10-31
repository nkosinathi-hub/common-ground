<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import {
    AsyncView,
    AuthCard,
    FormError,
    FormState,
    navigate,
    PublicLayout,
    Resource,
  } from "@/shared/ui"
  import type { InvitePreviewStatus } from "../domain/space"
  import { useSpaces } from "./context"

  interface Props {
    token: string
  }

  const COPY: Record<Exclude<InvitePreviewStatus, "valid">, string> = {
    invalid: "This invitation link is not valid. Ask for a new one.",
    used: "This invitation was already used. Each link works once.",
    revoked: "This invitation was cancelled.",
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
    navigate({ name: "home", spaceId: joined.value })
  }
</script>

<!-- No frame: joining from a link, on the sign-in layout (D21), one primary action. -->
<PublicLayout hero="Good things have a place here.">
  <AsyncView resource={preview}>
    {#snippet children(info)}
      <AuthCard
        title={info.status === "valid" ? `Join ${info.spaceName}` : "Invitation"}
        description={info.status === "valid" && info.inviterName
          ? `${info.inviterName} invited you.`
          : info.status === "valid"
            ? undefined
            : COPY[info.status]}
      >
        {#if info.status === "valid"}
          <FormError message={form.formError} />
          <Button onclick={accept} disabled={form.pending}>Accept and join</Button>
        {:else}
          <Button variant="outline" href="#/">Go to my spaces</Button>
        {/if}
      </AuthCard>
    {/snippet}
  </AsyncView>
</PublicLayout>
