<script lang="ts">
  import { AtSign, Mail } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { buildHash } from "@/shared/domain"
  import { FormError, FormField, FormState, toast } from "@/shared/ui"
  import AuthCard from "./AuthCard.svelte"
  import { useAuth } from "./context"

  interface Props {
    /** True when the reset link that brought the user here had expired. */
    expired?: boolean
  }

  let { expired = false }: Props = $props()
  const { service } = useAuth()
  const form = new FormState()
  let email = $state("")
  let sent = $state(false)
  const back = buildHash({ name: "sign-in" })

  async function send() {
    return (await form.run(() => service.requestPasswordReset(email))).ok
  }
  async function submit(event: SubmitEvent) {
    event.preventDefault()
    sent = await send()
  }
</script>

<!-- Figma D23 (ask), D23b (sent) and D23c (the link expired). -->
{#if sent}
  <AuthCard
    title="Check your email"
    description="If an account uses {email}, a reset link is on its way."
    backHref={back}
    backLabel="Back to sign in"
  >
    <Button
      variant="outline"
      disabled={form.pending}
      onclick={async () => (await send()) && toast.success("Link sent")}
      ><Mail aria-hidden="true" />Resend link</Button
    >
    <FormError message={form.formError} />
    {#snippet footer()}
      Wrong address? <Button variant="link" class="h-auto p-0" onclick={() => (sent = false)}
        >Try another email</Button
      >
    {/snippet}
  </AuthCard>
{:else}
  <AuthCard
    title={expired ? "This link has expired" : "Reset your password"}
    description={expired
      ? "Reset links work once and expire. Ask for a new one."
      : "We will email you a link to choose a new one."}
    backHref={back}
    backLabel="Back to sign in"
  >
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
        hint={expired
          ? undefined
          : "This only sends an email. Your password stays the same until you choose a new one."}
      />
      <FormError message={form.formError} />
      <Button type="submit" disabled={form.pending}
        >{expired ? "Send a new link" : "Send reset link"}</Button
      >
    </form>
  </AuthCard>
{/if}
