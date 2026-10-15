<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { FormField, FormState, toast } from "@/shared/ui"
  import { useAccount } from "./context"

  let { userId, displayName }: { userId: string; displayName: string } = $props()
  const { service } = useAccount()
  const form = new FormState()
  // Seeded once from the prop; the field is the user's draft from then on.
  // svelte-ignore state_referenced_locally
  let name = $state(displayName)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    if ((await form.run(() => service.changeDisplayName(userId, name))).ok)
      toast.success("Display name saved")
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Profile</Card.Title>
    <Card.Description>Members of your spaces see this name.</Card.Description>
  </Card.Header>
  <Card.Content>
    <form class="grid max-w-sm gap-3" onsubmit={submit} novalidate>
      <FormField
        id="display-name"
        label="Display name"
        bind:value={name}
        error={form.fieldError("displayName")}
      />
      {#if form.formError}<p role="alert" class="text-sm text-destructive">{form.formError}</p>{/if}
      <Button type="submit" class="w-fit" disabled={form.pending}>Save name</Button>
    </form>
  </Card.Content>
</Card.Root>
