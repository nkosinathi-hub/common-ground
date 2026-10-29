<script lang="ts">
  import { DialogShell, FormError, FormField, FormState, navigate, toast } from "@/shared/ui"
  import type { Space } from "../../domain/space"
  import { useSpaces } from "../context"

  let { open = $bindable(false), space }: { open: boolean; space: Space } = $props()
  const { service, store } = useSpaces()
  const form = new FormState()
  let confirmName = $state("")
  let password = $state("")

  async function remove() {
    const deleted = await form.run(() => service.delete(space.id, confirmName, password))
    if (!deleted.ok) return
    toast.success(`${space.name} was deleted`)
    await store.refresh()
    navigate({ name: "entry" })
  }
</script>

<!-- D17 "Delete space…": the name typed back and the password, then everything goes. -->
<DialogShell
  bind:open
  title="Delete {space.name}?"
  description="Notes, titles, ideas, tasks, budget and files go for everyone. This cannot be undone."
  primary="Delete space and everything in it"
  destructive
  busy={form.pending}
  disabled={confirmName !== space.name || password.length === 0}
  onsubmit={remove}
>
  <FormField id="confirm-name" label={`Type "${space.name}" to confirm`} bind:value={confirmName} />
  <FormField
    id="confirm-password"
    label="Your password"
    type="password"
    autocomplete="current-password"
    bind:value={password}
  />
  <FormError message={form.error?.message} />
</DialogShell>
