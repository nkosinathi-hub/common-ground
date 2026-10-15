<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { FormField, FormState } from "@/shared/ui"
  import { MIN_PASSWORD } from "../domain/credentials"
  import AuthCard from "./AuthCard.svelte"
  import { useAuth } from "./context"

  let { onDone }: { onDone: () => void } = $props()
  const { service } = useAuth()
  const form = new FormState()
  let password = $state("")

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    if ((await form.run(() => service.updatePassword(password))).ok) onDone()
  }
</script>

<AuthCard title="Choose a new password">
  <form class="grid gap-4" onsubmit={submit} novalidate>
    <FormField id="password" label="New password" type="password" autocomplete="new-password"
      bind:value={password} error={form.fieldError("password")} hint={`At least ${MIN_PASSWORD} characters.`} />
    {#if form.formError}<p role="alert" class="text-destructive text-sm">{form.formError}</p>{/if}
    <Button type="submit" disabled={form.pending}>Save password</Button>
  </form>
</AuthCard>
