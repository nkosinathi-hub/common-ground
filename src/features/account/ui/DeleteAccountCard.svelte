<script lang="ts">
  import { Lock } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { FormError, FormField, FormState } from "@/shared/ui"
  import { CONFIRM_WORD } from "../domain/account"
  import { useAccount } from "./context"

  interface Props {
    onDeleted: () => void
    /** Spaces this person owns with other members: the server refuses until they are handed on. */
    blockers?: readonly string[]
  }

  let { onDeleted, blockers = [] }: Props = $props()
  const { service } = useAccount()
  const form = new FormState()
  let password = $state("")
  let confirmation = $state("")

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    if ((await form.run(() => service.deleteAccount(password, confirmation))).ok) onDeleted()
  }
</script>

<!-- Figma D18b Delete account: what goes and what stays, a callout for spaces still owned with
     others, then the password and the word. -->
<Card.Root class="border-destructive">
  <Card.Header>
    <Card.Title>Delete account</Card.Title>
    <Card.Description>
      Your profile, sign-in details and memberships are removed. What you shared stays, credited to
      "Former member".
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <form class="flex flex-col gap-stack" onsubmit={submit} novalidate>
      {#if blockers.length}
        <Alert.Root role="note">
          <Lock aria-hidden="true" />
          <Alert.Description>
            You own {blockers.join(", ")}. Transfer ownership or delete {blockers.length === 1
              ? "that space"
              : "those spaces"} first.
          </Alert.Description>
        </Alert.Root>
      {/if}
      <FormField
        id="delete-password"
        label="Your password"
        type="password"
        autocomplete="current-password"
        placeholder="Enter your password"
        bind:value={password}
        error={form.fieldError("password")}
      />
      <FormField
        id="delete-confirmation"
        label={`Type ${CONFIRM_WORD} to confirm`}
        autocomplete="off"
        placeholder={CONFIRM_WORD}
        bind:value={confirmation}
        error={form.fieldError("confirmation")}
      />
      <FormError message={form.formError} />
      <Button
        type="submit"
        variant="destructive"
        class="w-full"
        disabled={form.pending || confirmation !== CONFIRM_WORD || password.length === 0}
      >
        Delete account…
      </Button>
    </form>
  </Card.Content>
</Card.Root>
