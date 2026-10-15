<script lang="ts">
  import { MailCheck } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { FormField, FormState } from "@/shared/ui"
  import { MIN_PASSWORD } from "../domain/credentials"
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
    const result = await form.run(() => service.signUp({ email, password, displayName }))
    sent = result.ok
  }
</script>

{#if sent}
  <AuthCard title="Check your email" description={`We sent a verification link to ${email}.`}>
    <div class="flex items-start gap-3 text-sm">
      <MailCheck class="size-5 shrink-0 text-primary" aria-hidden="true" />
      <p>Open the link on this device to finish creating your account. It expires in an hour.</p>
    </div>
    {#snippet footer()}<a class="hover:underline" href="#/auth/sign-in">Back to sign in</a
      >{/snippet}
  </AuthCard>
{:else}
  <AuthCard
    title="Create your account"
    description="A private place for what you watch and what you dream up."
  >
    <form class="grid gap-4" onsubmit={submit} novalidate>
      <FormField
        id="name"
        label="Your name"
        autocomplete="name"
        bind:value={displayName}
        error={form.fieldError("displayName")}
        hint="Only people in your spaces see this."
      />
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
        autocomplete="new-password"
        bind:value={password}
        error={form.fieldError("password")}
        hint={`At least ${MIN_PASSWORD} characters.`}
      />
      {#if form.formError}<p role="alert" class="text-sm text-destructive">{form.formError}</p>{/if}
      <Button type="submit" disabled={form.pending}
        >{form.pending ? "Creating" : "Create account"}</Button
      >
    </form>
    {#snippet footer()}
      <span
        >Already have an account? <a
          class="text-primary underline underline-offset-4"
          href="#/auth/sign-in">Sign in</a
        ></span
      >
      <a class="hover:underline" href="#/privacy">How we handle your data</a>
    {/snippet}
  </AuthCard>
{/if}
