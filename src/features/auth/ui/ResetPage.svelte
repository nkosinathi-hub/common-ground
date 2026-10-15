<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { FormField, FormState } from "@/shared/ui"
  import AuthCard from "./AuthCard.svelte"
  import { useAuth } from "./context"

  let { expired = false }: { expired?: boolean } = $props()
  const { service } = useAuth()
  const form = new FormState()
  let email = $state("")
  let sent = $state(false)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    sent = (await form.run(() => service.requestPasswordReset(email))).ok
  }
</script>

<AuthCard
  title={expired ? "That link has expired" : "Reset your password"}
  description={expired
    ? "Links work once and expire after an hour. Request a fresh one below."
    : "We will email you a link to choose a new password."}
>
  {#if sent}
    <p role="status" class="text-sm">
      If an account exists for {email}, a reset link is on its way.
    </p>
  {:else}
    <form class="grid gap-4" onsubmit={submit} novalidate>
      <FormField
        id="email"
        label="Email"
        type="email"
        autocomplete="email"
        bind:value={email}
        error={form.fieldError("email")}
      />
      {#if form.formError}<p role="alert" class="text-sm text-destructive">{form.formError}</p>{/if}
      <Button type="submit" disabled={form.pending}>Send reset link</Button>
    </form>
  {/if}
  {#snippet footer()}<a class="hover:underline" href="#/auth/sign-in">Back to sign in</a>{/snippet}
</AuthCard>
