<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { FormField, FormState } from "@/shared/ui"
  import AuthCard from "./AuthCard.svelte"
  import { useAuth } from "./context"

  const { service } = useAuth()
  const form = new FormState()
  let email = $state("")
  let password = $state("")
  let unverified = $state(false)
  let resent = $state(false)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const result = await form.run(() => service.signIn(email, password))
    unverified = !result.ok && result.error.message.includes("Confirm")
  }

  async function resend() {
    const result = await form.run(() => service.resendVerification(email))
    resent = result.ok
  }
</script>

<AuthCard title="Welcome back" description="Sign in to your shared spaces.">
  <form class="grid gap-4" onsubmit={submit} novalidate>
    <FormField
      id="email"
      label="Email"
      type="email"
      autocomplete="email"
      bind:value={email}
      error={form.fieldError("email")}
    />
    <FormField
      id="password"
      label="Password"
      type="password"
      autocomplete="current-password"
      bind:value={password}
    />
    {#if form.formError}<p role="alert" class="text-sm text-destructive">{form.formError}</p>{/if}
    {#if unverified && !resent}
      <Button type="button" variant="outline" onclick={resend}>Resend verification email</Button>
    {:else if resent}
      <p role="status" class="text-sm">Check your inbox for a new verification link.</p>
    {/if}
    <Button type="submit" disabled={form.pending}>{form.pending ? "Signing in" : "Sign in"}</Button>
  </form>
  {#snippet footer()}
    <a class="underline-offset-4 hover:underline" href="#/auth/reset">Forgot your password?</a>
    <span
      >New here? <a class="text-primary underline underline-offset-4" href="#/auth/sign-up"
        >Create an account</a
      ></span
    >
  {/snippet}
</AuthCard>
