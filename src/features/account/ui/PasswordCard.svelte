<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { FormField, FormState, toast } from "@/shared/ui"
  import { useAccount } from "./context"

  const { service } = useAccount()
  const form = new FormState()
  let current = $state("")
  let next = $state("")

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    if (!(await form.run(() => service.changePassword(current, next))).ok) return
    current = ""
    next = ""
    toast.success("Password changed")
  }
</script>

<Card.Root>
  <Card.Header><Card.Title>Password</Card.Title></Card.Header>
  <Card.Content>
    <form class="grid max-w-sm gap-3" onsubmit={submit} novalidate>
      <FormField
        id="current-password"
        label="Current password"
        type="password"
        autocomplete="current-password"
        bind:value={current}
        error={form.fieldError("currentPassword")}
      />
      <FormField
        id="new-password"
        label="New password"
        type="password"
        autocomplete="new-password"
        bind:value={next}
        error={form.fieldError("password")}
        hint="At least 10 characters."
      />
      {#if form.formError}<p role="alert" class="text-sm text-destructive">{form.formError}</p>{/if}
      <Button type="submit" class="w-fit" disabled={form.pending}>Change password</Button>
    </form>
  </Card.Content>
</Card.Root>
