<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { FormError, FormField, FormState, toast } from "@/shared/ui"
  import { MIN_PASSWORD } from "@/shared/domain"
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
    <form class="flex flex-col gap-stack" onsubmit={submit} novalidate>
      <div class="grid gap-stack sm:grid-cols-2">
        <FormField
          id="current-password"
          label="Current password"
          type="password"
          autocomplete="current-password"
          bind:value={current}
          error={form.fieldError("currentPassword")}
          placeholder="Enter your current password"
        />
        <FormField
          id="new-password"
          label="New password"
          type="password"
          autocomplete="new-password"
          bind:value={next}
          error={form.fieldError("password")}
          placeholder={`At least ${MIN_PASSWORD} characters`}
        />
      </div>
      <FormError message={form.formError} />
      <div class="flex justify-end border-t border-border pt-stack">
        <Button type="submit" variant="outline" disabled={form.pending || !current || !next}
          >Change password</Button
        >
      </div>
    </form>
  </Card.Content>
</Card.Root>
