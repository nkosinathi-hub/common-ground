<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { ConfirmDialog, FormError, FormField, FormState, navigate, toast } from "@/shared/ui"
  import type { Space } from "../domain/space"
  import { useSpaces } from "./context"

  interface Props {
    space: Space
  }

  let { space }: Props = $props()
  const { service, store } = useSpaces()
  const form = new FormState()
  let leaving = $state(false)
  let confirmName = $state("")
  let password = $state("")

  async function leave() {
    const left = await service.leave(space.id)
    if (!left.ok) {
      toast.error(left.error.message)
      return
    }
    await store.refresh()
    navigate({ name: "entry" })
  }

  async function remove(event: SubmitEvent) {
    event.preventDefault()
    const deleted = await form.run(() => service.delete(space.id, confirmName, password))
    if (!deleted.ok) return
    toast.success(`${space.name} was deleted`)
    await store.refresh()
    navigate({ name: "entry" })
  }
</script>

<Card.Root class="border-destructive/40">
  <Card.Header><Card.Title>Leave or delete</Card.Title></Card.Header>
  <Card.Content class="grid gap-4">
    {#if space.role === "member"}
      <Button variant="outline" class="w-fit" onclick={() => (leaving = true)}
        >Leave this space</Button
      >
    {:else}
      <p class="text-sm text-muted-foreground">
        As the owner you cannot leave. Make someone else the owner first, or delete the space.
      </p>
      <form class="grid max-w-sm gap-3" onsubmit={remove} novalidate>
        <FormField
          id="confirm-name"
          label={`Type "${space.name}" to confirm`}
          bind:value={confirmName}
        />
        <FormField
          id="confirm-password"
          label="Your password"
          type="password"
          autocomplete="current-password"
          bind:value={password}
        />
        <FormError message={form.error?.message} />
        <Button
          type="submit"
          variant="destructive"
          class="w-fit"
          disabled={form.pending || confirmName !== space.name || password.length === 0}
        >
          Delete space and everything in it
        </Button>
      </form>
    {/if}
  </Card.Content>
</Card.Root>

<ConfirmDialog
  bind:open={leaving}
  title={`Leave ${space.name}?`}
  description="You lose access right away. You can rejoin only with a new invitation."
  confirmLabel="Leave"
  onConfirm={leave}
/>
