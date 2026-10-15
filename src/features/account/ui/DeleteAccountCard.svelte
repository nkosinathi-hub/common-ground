<script lang="ts">
  import { TriangleAlert } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { FormField, FormState } from "@/shared/ui"
  import { CONFIRM_WORD } from "../domain/account"
  import { useAccount } from "./context"

  interface Props {
    onDeleted: () => void
  }

  let { onDeleted }: Props = $props()
  const { service } = useAccount()
  const form = new FormState()
  let password = $state("")
  let confirmation = $state("")

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    if ((await form.run(() => service.deleteAccount(password, confirmation))).ok) onDeleted()
  }
</script>

<Card.Root class="border-destructive/40">
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <TriangleAlert class="size-4 text-destructive" aria-hidden="true" /> Delete account
    </Card.Title>
    <Card.Description>
      Your profile, sign-in and memberships are removed, and spaces only you belong to are deleted.
      What you added to shared spaces stays there, shown as from a former member. Hand over or
      delete spaces you own with others first.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <form class="grid max-w-sm gap-3" onsubmit={submit} novalidate>
      <FormField
        id="delete-password"
        label="Your password"
        type="password"
        autocomplete="current-password"
        bind:value={password}
        error={form.fieldError("password")}
      />
      <FormField
        id="delete-confirmation"
        label={`Type ${CONFIRM_WORD} to confirm`}
        autocomplete="off"
        bind:value={confirmation}
        error={form.fieldError("confirmation")}
      />
      {#if form.formError}<p role="alert" class="text-sm text-destructive">{form.formError}</p>{/if}
      <Button
        type="submit"
        variant="destructive"
        class="w-fit"
        disabled={form.pending || confirmation !== CONFIRM_WORD || password.length === 0}
      >
        Delete my account
      </Button>
    </form>
  </Card.Content>
</Card.Root>
