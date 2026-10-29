<script lang="ts">
  import { AtSign, Lock, Mail } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { Button } from "$lib/components/ui/button"
  import { MIN_PASSWORD, buildHash } from "@/shared/domain"
  import { FormError, FormField, FormState, TextLink, toast } from "@/shared/ui"
  import AuthCard from "./AuthCard.svelte"
  import { useAuth } from "./context"

  const { service } = useAuth()
  const form = new FormState()
  let displayName = $state("")
  let email = $state("")
  let password = $state("")
  let sent = $state(false)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    sent = (await form.run(() => service.signUp({ email, password, displayName }))).ok
  }
  async function resend() {
    if ((await form.run(() => service.resendVerification(email))).ok) toast.success("Email sent")
  }
</script>

<!-- Figma D22 (the form) and D22b (the link is on its way). -->
{#if sent}
  <AuthCard
    title="Check your email"
    description="We sent a link to {email}. Open it to finish creating your account."
  >
    <Button variant="outline" disabled={form.pending} onclick={resend}
      ><Mail aria-hidden="true" />Resend email</Button
    >
    <FormError message={form.formError} />
    {#snippet footer()}
      Wrong address? <Button variant="link" class="h-auto p-0" onclick={() => (sent = false)}
        >Use a different email</Button
      >
    {/snippet}
  </AuthCard>
{:else}
  <AuthCard
    title="Create your account"
    description="A private place for what you watch and what you dream up."
  >
    <form class="flex flex-col gap-stack" onsubmit={submit} novalidate>
      <FormField
        id="name"
        label="Your name"
        autocomplete="name"
        placeholder="What should we call you?"
        bind:value={displayName}
        error={form.fieldError("displayName")}
        hint="Only people in your spaces see this."
      />
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
      <FormField
        id="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        placeholder="Create a password"
        bind:value={password}
        error={form.fieldError("password")}
        hint={`At least ${MIN_PASSWORD} characters.`}
      />
      <Alert.Root role="note">
        <Lock aria-hidden="true" />
        <Alert.Description>Your email is never shown to other members.</Alert.Description>
      </Alert.Root>
      <FormError message={form.formError} />
      <Button type="submit" disabled={form.pending}
        >{form.pending ? "Creating" : "Create account"}</Button
      >
    </form>
    {#snippet footer()}
      Already have an account? <TextLink href={buildHash({ name: "sign-in" })}>Sign in</TextLink>
    {/snippet}
  </AuthCard>
{/if}
