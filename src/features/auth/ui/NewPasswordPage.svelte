<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { MIN_PASSWORD } from "@/shared/domain"
  import { FormError, FormField, FormState } from "@/shared/ui"
  import AuthCard from "./AuthCard.svelte"
  import { useAuth } from "./context"

  let { onDone }: { onDone: () => void } = $props()
  const { service, session } = useAuth()
  const form = new FormState()
  let password = $state("")
  let again = $state("")
  let mismatch = $state(false)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    mismatch = password !== again
    if (mismatch) return
    if ((await form.run(() => service.updatePassword(password))).ok) onDone()
  }
</script>

<!-- Figma D23d: the new password twice, for the account the link belongs to. -->
<AuthCard
  title="Choose a new password"
  description={session.user ? `For ${session.user.email}.` : undefined}
>
  <form class="flex flex-col gap-stack" onsubmit={submit} novalidate>
    <FormField
      id="password"
      label="New password"
      type="password"
      autocomplete="new-password"
      placeholder="Create a password"
      bind:value={password}
      error={form.fieldError("password")}
      hint={`At least ${MIN_PASSWORD} characters.`}
    />
    <FormField
      id="password-again"
      label="Confirm new password"
      type="password"
      autocomplete="new-password"
      placeholder="Type it again"
      bind:value={again}
      error={mismatch ? "The two passwords are not the same" : undefined}
    />
    <FormError message={form.formError} />
    <Button type="submit" disabled={form.pending}>Save password</Button>
  </form>
</AuthCard>
