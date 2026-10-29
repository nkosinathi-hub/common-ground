<script lang="ts">
  import { ArrowRight, AtSign, Mail } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { Button } from "$lib/components/ui/button"
  import { buildHash } from "@/shared/domain"
  import { FormError, FormField, FormState, TextLink } from "@/shared/ui"
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
    // Sign-in is denied only while the email is unconfirmed (see AuthGateway.signIn).
    unverified = !result.ok && result.error.kind === "denied"
  }
  async function resend() {
    resent = (await form.run(() => service.resendVerification(email))).ok
  }
</script>

<!-- Figma D21 and D21b: email and password, then the sample space for anyone without one. -->
<AuthCard title="Welcome back" description="Sign in to your shared spaces.">
  {#if unverified}
    <Alert.Root variant="secondary" role="status">
      <Mail aria-hidden="true" />
      <Alert.Description>
        {resent
          ? `Check your inbox for a new verification link at ${email}.`
          : `Confirm your email to sign in. We sent a link to ${email}.`}
      </Alert.Description>
    </Alert.Root>
    {#if !resent}
      <p class="type-sm text-muted-foreground">
        Didn't get it? <Button variant="link" class="h-auto p-0" onclick={resend}
          >Resend verification email</Button
        >
      </p>
    {/if}
  {/if}
  <form class="flex flex-col gap-stack" onsubmit={submit} novalidate>
    <FormField
      id="email"
      label="Email"
      type="email"
      autocomplete="email"
      icon={AtSign}
      placeholder="you@example.com"
      bind:value={email}
      error={form.fieldError("email")}
    />
    <div class="flex flex-col gap-related">
      <FormField
        id="password"
        label="Password"
        type="password"
        autocomplete="current-password"
        placeholder="Enter your password"
        bind:value={password}
      />
      <TextLink href={buildHash({ name: "reset" })} class="self-end type-label-sm"
        >Forgot password?</TextLink
      >
    </div>
    <FormError message={form.formError} />
    <Button type="submit" disabled={form.pending}>{form.pending ? "Signing in" : "Sign in"}</Button>
  </form>
  <div class="flex items-center gap-item type-xs text-muted-foreground" aria-hidden="true">
    <span class="h-px flex-1 bg-border"></span>or<span class="h-px flex-1 bg-border"></span>
  </div>
  <div class="flex flex-col gap-related text-center">
    <Button variant="outline" href={buildHash({ name: "demo" })}
      >Explore the sample space<ArrowRight aria-hidden="true" /></Button
    >
    <p class="type-xs text-muted-foreground">
      No account needed. Changes in the sample are not saved.
    </p>
  </div>
  {#snippet footer()}
    New here? <TextLink href={buildHash({ name: "sign-up" })}>Create an account</TextLink>
  {/snippet}
</AuthCard>
